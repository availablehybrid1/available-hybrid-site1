import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData =
  | { success: true }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, phone, email, vehicle, service, message } = req.body ?? {};

    if (!name || !phone || !vehicle || !service) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const response = await fetch(
      "https://formsubmit.co/ajax/availablehybrid@gmail.com",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: "New Service Request - AVAILABLE HYBRID R&M INC.",
          name,
          phone,
          email,
          vehicle,
          service,
          message,
        }),
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: "Error sending request" });
    }

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
}
