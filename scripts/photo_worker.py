"""Local inventory photo processor. Originals stay in Entrada; review Salida.

Requires Python 3.13 and rembg[cpu,cli]. No API key or web server needed.
Run: py -3.13 photo_worker.py --watch
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import time

from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageChops


def studio(cutout):
    """Composite original RGB over a neutral studio without vehicle retouching."""
    w, h = cutout.size
    background = Image.new('RGBA', (w, h))
    draw = ImageDraw.Draw(background)
    for y in range(h):
        tone = int(65 + 115 * math.exp(-((y / h - .70) / .33) ** 2))
        draw.line((0, y, w, y), fill=(tone, tone, tone, 255))
    # A soft generic floor shadow is only a preview; its position needs review
    # for each camera angle. It never changes the foreground pixels.
    bounds = cutout.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox()
    if not bounds:
        raise ValueError('No se detecto el vehiculo. Conserva la foto original.')
    left, top, right, bottom = bounds
    bw, bh = right - left, bottom - top
    shadow = Image.new('RGBA', (w, h))
    sd = ImageDraw.Draw(shadow)
    points = [(.05, .40), (.45, 1.0), (.95, .77), (.50, .35)]
    sd.polygon([(int(left + bw*x), int(top + bh*y)) for x, y in points],
               fill=(0, 0, 0, 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(w * .018))
    return Image.alpha_composite(Image.alpha_composite(background, shadow), cutout)


def read_source(path):
    with Image.open(path) as image:
        return ImageOps.exif_transpose(image).convert('RGBA')


def extract(source, session):
    # Use the predicted mask, not regenerated/retouched vehicle RGB.
    masks = session.predict(source.convert('RGB'))
    if len(masks) != 1:
        raise ValueError('Recorte ambiguo: revisa esta foto manualmente.')
    alpha = ImageChops.multiply(source.getchannel('A'), masks[0].convert('L'))
    cutout = source.copy()
    cutout.putalpha(alpha)
    return cutout


def save_png(image, target):
    temporary = target.with_suffix('.tmp')
    image.save(temporary, format='PNG')
    temporary.replace(target)


def fingerprint(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description='Fotos de inventario: recorte y fondo local')
    parser.add_argument('--watch', action='store_true')
    parser.add_argument('--cutout', type=Path, help='Prueba con un PNG ya recortado')
    parser.add_argument('--root', type=Path, default=Path.home()/'HybridFotos')
    args = parser.parse_args()
    incoming, outgoing = args.root/'Entrada', args.root/'Salida'
    incoming.mkdir(parents=True, exist_ok=True)
    outgoing.mkdir(parents=True, exist_ok=True)
    if args.cutout:
        image = read_source(args.cutout)
        if image.getchannel('A').getextrema()[0] == 255:
            raise ValueError('El PNG debe tener fondo transparente.')
        target = outgoing/(args.cutout.stem + '-estudio.png')
        save_png(studio(image), target)
        print('Listo:', target, flush=True)
        return
    state_file = args.root/'procesadas.json'
    try:
        state = json.loads(state_file.read_text(encoding='utf-8'))
        if not isinstance(state, dict):
            state = {}
    except (OSError, ValueError):
        state = {}
    session = None
    observations, failures = {}, {}
    print('Listo. Copia fotos originales en:', incoming, flush=True)
    print('Resultados para revisar en:', outgoing, flush=True)
    print('Para detener: Ctrl+C. Aun no esta conectado a Telegram.', flush=True)
    try:
        while True:
            for path in sorted(incoming.iterdir()):
                if not path.is_file() or path.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp'}:
                    continue
                digest = None
                try:
                    stat = path.stat()
                    marker = (stat.st_size, stat.st_mtime_ns)
                    if args.watch and observations.get(str(path)) != marker:
                        observations[str(path)] = marker
                        continue  # Wait until the copy is stable across scans.
                    digest = fingerprint(path)
                    key = path.name
                    stem = path.name + '-' + digest[:12]
                    target = outgoing/(stem + '-estudio.png')
                    cutout_target = outgoing/(stem + '-recorte.png')
                    if state.get(key) == digest and target.exists() and cutout_target.exists():
                        continue
                    if failures.get(key) == digest:
                        continue
                    print('Procesando:', path.name, flush=True)
                    source = read_source(path)
                    if session is None:
                        from rembg import new_session
                        session = new_session('birefnet-general', providers=['CPUExecutionProvider'])
                    cutout = extract(source, session)
                    save_png(cutout, cutout_target)
                    save_png(studio(cutout), target)
                    state[key] = digest
                    tmp = state_file.with_suffix('.tmp')
                    tmp.write_text(json.dumps(state, indent=2), encoding='utf-8')
                    tmp.replace(state_file)
                    print('Listo:', target.name, flush=True)
                except Exception as error:
                    print('No se pudo procesar', path.name, ':', error, flush=True)
                    if digest is not None:
                        failures[path.name] = digest
            if not args.watch:
                return
            time.sleep(3)
    except KeyboardInterrupt:
        print('\nPrograma detenido. Las fotos originales siguen en Entrada.', flush=True)


if __name__ == '__main__':
    main()
