"use client";
import MuxUploader from "@mux/mux-uploader-react";

const UploadReel = ({ uploadUrl }: { uploadUrl: string }) => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Upload Reel
        </h1>

        <div className="flex flex-col items-center justify-center gap-4">
          <MuxUploader type="radial" endpoint={uploadUrl} />
        </div>
      </div>
    </main>
  );
};

export default UploadReel;
