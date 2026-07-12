import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, QrCode } from 'lucide-react';

export const QRCard = ({ asset }) => {
  const printRef = useRef();

  const handlePrint = () => {
    // We add print-qr-section to the container dynamically, trigger print, then restore
    const printContents = printRef.current.outerHTML;
    const originalContents = document.body.innerHTML;
    
    // Create temporary print window style
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Asset Tag - ${asset.assetId}</title>
          <style>
            body {
              font-family: 'Outfit', 'Inter', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: white;
            }
            .tag {
              border: 2px solid #000;
              padding: 20px;
              width: 300px;
              text-align: center;
              border-radius: 8px;
            }
            .header {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .sub {
              font-size: 11px;
              color: #555;
              margin-bottom: 15px;
              text-transform: uppercase;
            }
            .qr {
              display: inline-block;
              margin-bottom: 15px;
            }
            .name {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .id {
              font-family: monospace;
              font-size: 13px;
              background-color: #f1f1f1;
              padding: 2px 6px;
              border-radius: 4px;
              display: inline-block;
            }
            @media print {
              body { height: auto; }
              .tag { border: 2px solid #000; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="header">ASSETFLOW CORP</div>
            <div class="sub">PROPERTY TAG - DO NOT REMOVE</div>
            <div class="qr">${printRef.current.querySelector('.qr-holder').innerHTML}</div>
            <div class="name">${asset.name}</div>
            <div class="id">${asset.assetId}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center">
      {/* Label Layout */}
      <div 
        ref={printRef}
        className="w-[260px] bg-white text-slate-900 p-6 rounded-xl border-2 border-slate-900 shadow-sm flex flex-col items-center text-center"
      >
        <div className="text-xs font-black tracking-widest text-slate-800 uppercase">
          AssetFlow Corp
        </div>
        <div className="text-[9px] font-bold text-slate-500 tracking-wider mb-4 uppercase">
          Property Tag - Do Not Remove
        </div>
        
        {/* QR container */}
        <div className="qr-holder mb-4 bg-white p-2 rounded-lg border border-slate-200">
          <QRCodeSVG 
            value={`http://localhost:5173/assets/${asset.assetId}`} 
            size={120}
            level={"H"}
            includeMargin={true}
          />
        </div>

        <div className="text-sm font-semibold text-slate-800 truncate w-full">
          {asset.name}
        </div>
        <div className="mt-1 text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
          {asset.assetId}
        </div>
      </div>

      {/* Action triggers */}
      <div className="mt-4 flex gap-2 w-full">
        <button
          onClick={handlePrint}
          className="flex-1 inline-flex justify-center items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl transition-all shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Label
        </button>
      </div>
    </div>
  );
};
