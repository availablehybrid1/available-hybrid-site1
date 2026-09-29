"""Local inventory photo processor. Originals stay in Entrada; review Salida.

Requires Python 3.13 and rembg[cpu,cli]. No API key or web server needed.
Run: py -3.13 photo_worker.py --watch
"""
import argparse
import base64
import hashlib
import io
import json
import math
from pathlib import Path
import secrets
import time
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlparse

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


def cloud_request(token, payload=None):
    url = 'https://hybridrm.com/api/photo-worker'
    body = json.dumps(payload).encode('utf-8') if payload is not None else None
    request = Request(url, data=body, headers={
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
    })
    with urlopen(request, timeout=90) as response:
        return json.load(response)


def cloud(root, watch):
    token_file = root/'worker-token.txt'
    if not token_file.exists():
        raise ValueError('Primero ejecuta --setup para crear la clave de conexion.')
    token = token_file.read_text(encoding='utf-8').strip()
    incoming, outgoing = root/'Entrada', root/'Salida'
    incoming.mkdir(parents=True, exist_ok=True)
    outgoing.mkdir(parents=True, exist_ok=True)
    session = None
    failures = set()
    print('Conectando con hybridrm.com. Ctrl+C para detener.', flush=True)
    try:
        while True:
            try:
                jobs = cloud_request(token).get('jobs', [])
                if not jobs:
                    print('Conectado. Esperando nuevas fotos principales de inventario.', flush=True)
                for job in jobs:
                    source_url, vehicle_id = job['sourceUrl'], job['vehicleId']
                    parsed = urlparse(source_url)
                    if parsed.scheme != 'https' or not parsed.hostname or not parsed.hostname.endswith('.public.blob.vercel-storage.com'):
                        print('Origen de foto no compatible:', vehicle_id, flush=True)
                        continue
                    key = hashlib.sha256(json.dumps([vehicle_id, source_url], separators=(',', ':')).encode()).hexdigest()
                    if key in failures:
                        continue
                    print('Procesando inventario:', vehicle_id, flush=True)
                    try:
                        with urlopen(source_url, timeout=60) as response:
                            raw = response.read(20000001)
                        if len(raw) > 20000000:
                            raise ValueError('Foto original demasiado grande')
                        source_path = incoming/(key + '.png')
                        with Image.open(io.BytesIO(raw)) as image:
                            source = ImageOps.exif_transpose(image).convert('RGBA')
                        save_png(source, source_path)
                        target = outgoing/(key + '-estudio.png')
                        if not target.exists():
                            if session is None:
                                from rembg import new_session
                                session = new_session('birefnet-general', providers=['CPUExecutionProvider'])
                            cutout = extract(source, session)
                            save_png(cutout, outgoing/(key + '-recorte.png'))
                            save_png(studio(cutout), target)
                        encoded = target.read_bytes()
                        if len(encoded) > 3000000:
                            # Lossless compression only; do not rescale or repaint the car.
                            with Image.open(target) as image:
                                buffer = io.BytesIO()
                                image.save(buffer, format='PNG', optimize=True)
                                encoded = buffer.getvalue()
                        if len(encoded) > 3000000:
                            raise ValueError('PNG supera 3 MB. Requiere subida de archivo grande.')
                        cloud_request(token, {'vehicleId': vehicle_id, 'sourceUrl': source_url,
                            'imageBase64': base64.b64encode(encoded).decode('ascii')})
                        print('Foto principal actualizada:', vehicle_id, flush=True)
                    except HTTPError as error:
                        if error.code == 409:
                            print('La foto cambio mientras se procesaba; se usara la actual.', flush=True)
                        else:
                            raise
                    except Exception as error:
                        failures.add(key)
                        print('Revisar foto', vehicle_id, ':', error, flush=True)
            except HTTPError as error:
                if error.code in (401, 503):
                    print('Falta configurar PHOTO_WORKER_TOKEN en Vercel o la clave no coincide.', flush=True)
                    return
                print('Conexion pendiente. HTTP', error.code, flush=True)
            except Exception as error:
                print('Conexion pendiente:', error, flush=True)
            if not watch:
                return
            time.sleep(60)
    except KeyboardInterrupt:
        print('\nConexion detenida.', flush=True)


def main():
    parser = argparse.ArgumentParser(description='Fotos de inventario: recorte y fondo local')
    parser.add_argument('--watch', action='store_true')
    parser.add_argument('--cloud', action='store_true', help='Procesar portadas de hybridrm.com')
    parser.add_argument('--setup', action='store_true', help='Crear clave privada para Vercel')
    parser.add_argument('--cutout', type=Path, help='Prueba con un PNG ya recortado')
    parser.add_argument('--root', type=Path, default=Path.home()/'HybridFotos')
    args = parser.parse_args()
    incoming, outgoing = args.root/'Entrada', args.root/'Salida'
    incoming.mkdir(parents=True, exist_ok=True)
    outgoing.mkdir(parents=True, exist_ok=True)
    if args.setup:
        token_file = args.root/'worker-token.txt'
        if not token_file.exists():
            token_file.write_text(secrets.token_urlsafe(48), encoding='utf-8')
        print('Copia esta clave SOLO en PHOTO_WORKER_TOKEN de Vercel. No la envies por chat:')
        print(token_file.read_text(encoding='utf-8').strip())
        return
    if args.cloud:
        cloud(args.root, args.watch)
        return
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
