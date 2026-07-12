import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Camera, ScanLine, AlertCircle } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose }) => {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load available assets to simulate scanning
  useEffect(() => {
    if (isOpen) {
      const fetchAssets = async () => {
        setLoading(true);
        try {
          const storedUser = localStorage.getItem('assetflow_user');
          const token = storedUser ? JSON.parse(storedUser).token : '';
          const response = await fetch('http://localhost:5000/api/assets?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (response.ok) {
            setAssets(data.assets || []);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchAssets();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (asset) => {
    // Navigate directly to the asset's detail view
    onClose();
    navigate(`/assets/${asset.assetId}`);
  };

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              QR Code Scanner
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Box Mock */}
        <div className="relative bg-slate-950 flex flex-col items-center justify-center py-10 px-6 aspect-video overflow-hidden">
          {/* Scanning Box Bracket */}
          <div className="relative w-48 h-48 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center">
            {/* Scan animation line */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-400 shadow-lg shadow-blue-500 animate-[bounce_2s_infinite]"></div>
            <ScanLine className="w-12 h-12 text-blue-500/30" />
          </div>
          <div className="absolute bottom-3 text-center text-[10px] tracking-wider text-slate-400 font-medium uppercase">
            Simulating live camera feed...
          </div>
        </div>

        {/* Selection Simulator Panel */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
          <div className="flex gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs leading-relaxed border border-blue-200/40">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              In a production mobile app, pointing the camera at a printed AssetFlow QR tag opens the asset file instantly. Select a seeded asset below to simulate a successful scan.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Search Asset to Scan
            </label>
            <input
              type="text"
              placeholder="e.g. Dell XPS, Boardroom, Tesla..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-grow overflow-y-auto max-h-[160px] border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading catalog...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No assets found matching query</div>
            ) : (
              filteredAssets.map((asset) => (
                <button
                  key={asset._id}
                  onClick={() => handleSimulateScan(asset)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center text-xs"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{asset.name}</span>
                  <span className="font-mono text-slate-400">{asset.assetId}</span>
                </button>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
