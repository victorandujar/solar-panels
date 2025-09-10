import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(request: NextRequest) {
  try {
    const filePath = join(
      process.cwd(),
      "src",
      "utils",
      "TINSurface_original.txt",
    );

    const data = await readFile(filePath, "utf-8");

    const lines = data.split("\n").slice(0, 1000);
    const limitedData = lines.join("\n");

    return NextResponse.json({
      data: limitedData,
      totalLines: data.split("\n").length,
      renderedLines: lines.length,
    });
  } catch (error) {
    const exampleData = `71420,119;54164,805;384|71419,34;54163,645;384|71413,769;54175,193;384,5
71430,032;54159,618;383,5|71420,119;54164,805;384|71420,899;54165,965;384
71420,899;54165,965;384|71420,119;54164,805;384|71413,769;54175,193;384,5
71421,679;54167,125;384|71430,7;54160,737;383,5|71420,899;54165,965;384
71422,459;54168,285;384|71431,368;54161,857;383,5|71421,679;54167,125;384
71420,899;54165,965;384|71413,769;54175,193;384,5|71421,679;54167,125;384
71420,119;54164,805;384|71429,364;54158,498;383,5|71419,34;54163,645;384
71421,679;54167,125;384|71414,816;54175,853;384,5|71422,459;54168,285;384
71419,34;54163,645;384|71429,364;54158,498;383,5|71428,696;54157,378;383,5
71437,232;54152,53;383|71428,028;54156,258;383,5|71428,696;54157,378;383,5`;

    return NextResponse.json({
      data: exampleData,
      totalLines: 10,
      renderedLines: 10,
      fallback: true,
    });
  }
}
