import Image from "next/image";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-beith-gray-900 mb-4">
          Welcome to Beith Digital Preflight Portal
        </h1>
        <p className="text-xl text-beith-gray-600 max-w-3xl mx-auto">
          Upload your artwork files and get instant validation against our print specifications. 
          Ensure your designs are print-ready before production.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg border border-beith-gray-200 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-beith-blue-100 mb-4">
              <svg className="h-6 w-6 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-beith-gray-900 mb-2">
              Upload Your Artwork
            </h2>
            <p className="text-beith-gray-600 mb-6">
              Drag and drop your files here or click to browse
            </p>
            <div className="border-2 border-dashed border-beith-gray-300 rounded-lg p-8 hover:border-beith-blue-400 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-beith-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-beith-gray-600">
                  PDF, AI, INDD, PSD, or TIFF files up to 100MB
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-5 w-5 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-beith-gray-900">Instant Validation</h3>
            <p className="text-sm text-beith-gray-600">Get immediate feedback on your artwork specifications</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-5 w-5 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-beith-gray-900">Visual Preview</h3>
            <p className="text-sm text-beith-gray-600">See exactly how your artwork will print with guides</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-beith-blue-100 mb-3">
              <svg className="h-5 w-5 text-beith-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-beith-gray-900">Smart Guidance</h3>
            <p className="text-sm text-beith-gray-600">Get step-by-step instructions to fix any issues</p>
          </div>
        </div>
      </div>
    </div>
  );
}
