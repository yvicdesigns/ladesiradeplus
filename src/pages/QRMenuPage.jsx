import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, ArrowRight, ShoppingCart, ScanLine, AlertCircle, RefreshCw, Keyboard, Camera as CameraIcon } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { supabase } from '@/lib/customSupabaseClient';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { extractTableIdFromQrCode } from '@/lib/qrCodeUtils';
import { CameraPermissionModal } from '@/components/CameraPermissionModal';

export const QRMenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tableParam = searchParams.get('table');
  const navigate = useNavigate();
  
  // Data States
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Table State
  const [tableInfoState, setTableInfoState] = useState(null);

  // Scanner States
  const [cameraStatus, setCameraStatus] = useState('idle'); // idle, requesting, active, denied, error
  const [cameraErrorDetails, setCameraErrorDetails] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI States
  const [isManualInputMode, setIsManualInputMode] = useState(false);
  const [manualTableId, setManualTableId] = useState('');
  
  const scannerRef = useRef(null);
  
  const { addToCart, getItemCount, setTableInfo } = useCart();
  const { toast } = useToast();
  const cartItemCount = getItemCount();

  // 1. Initial Data Fetch
  useEffect(() => {
    fetchMenuData();
  }, []);

  // 2. Fetch Table Info if param exists
  useEffect(() => {
    if (tableParam) {
      // Stop camera if we have a table param (successful scan)
      cleanupScanner();
      setCameraStatus('idle');
      fetchTableInfo(tableParam);
    }
  }, [tableParam]);

  const fetchMenuData = async () => {
    try {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase.from('menu_categories').select('*').order('display_order'),
        supabase.from('menu_items').select('*').eq('is_available', true)
      ]);
      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (itemsResult.data) setMenuItems(itemsResult.data);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTableInfo = async (identifier) => {
    try {
      // Try to find table by number first (assuming QR contains table number)
      // Or by ID if it's a UUID
      let query = supabase.from('tables').select('id, table_number, status').limit(1);
      
      // Simple check if it looks like a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      
      if (isUuid) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('table_number', identifier);
      }

      const { data, error } = await query.single();

      if (data) {
        setTableInfoState(data);
        setTableInfo(data);
      } else {
        console.warn('Table not found:', error);
        // Fallback: create a temporary object
        const fallback = { table_number: identifier, id: null }; 
        setTableInfoState(fallback);
        setDineIn(fallback);
      }
    } catch (err) {
      console.error('Error fetching table:', err);
    }
  };

  // 3. Camera Logic
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      cleanupScanner();
    };
  }, []);

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error cleaning up scanner:", err);
      }
      scannerRef.current = null;
    }
  };

  const requestCameraAccess = async () => {
    setCameraStatus('requesting');
    setCameraErrorDetails(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Votre navigateur ne supporte pas l'accès à la caméra.");
      }

      // Explicitly request permission first to catch errors cleanly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment"
          } 
        });
        
        // Stop the tracks immediately, we just needed permission
        stream.getTracks().forEach(track => track.stop());
        
        // Start the actual scanner
        startScanner();
        
      } catch (permissionErr) {
        if (permissionErr.name === 'NotAllowedError' || permissionErr.name === 'PermissionDeniedError') {
          setCameraStatus('denied');
        } else if (permissionErr.name === 'NotFoundError') {
           setCameraStatus('error');
           setCameraErrorDetails("Aucune caméra détectée sur cet appareil.");
        } else {
           setCameraStatus('error');
           setCameraErrorDetails(permissionErr.message || "Impossible d'accéder à la caméra.");
        }
      }

    } catch (err) {
      console.error("Camera init error:", err);
      setCameraStatus('error');
      setCameraErrorDetails(err.message);
    }
  };

  const startScanner = async () => {
    if (!document.getElementById("qr-reader")) {
      // Retry if DOM not ready
      setTimeout(startScanner, 100);
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanFailure
      );
      
      setCameraStatus('active');
      setIsManualInputMode(false);

    } catch (err) {
      console.error("Scanner start error:", err);
      setCameraStatus('error');
      setCameraErrorDetails("Erreur lors du démarrage du scanner.");
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    if (isProcessing) return;
    
    const detectedTableId = extractTableIdFromQrCode(decodedText);
    
    if (detectedTableId) {
      setIsProcessing(true);
      if (navigator.vibrate) navigator.vibrate(200);
      
      await cleanupScanner();
      
      toast({
        title: "Code QR détecté !",
        description: `Bienvenue à la table ${detectedTableId}`,
        className: "bg-green-600 text-white border-none",
      });

      // Small delay for UX
      setTimeout(() => {
        setSearchParams({ table: detectedTableId });
        setIsProcessing(false);
      }, 300);
    }
  };

  const onScanFailure = (error) => {
    // Ignore minor scanning errors
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualTableId.trim()) {
       setSearchParams({ table: manualTableId.trim() });
    }
  };

  const switchToManualInput = () => {
    setIsManualInputMode(true);
    // Don't necessarily stop camera status logic, but we might hide the modal
    if (cameraStatus !== 'active') {
       // If camera wasn't active, ensure we don't show the permission modal on top of manual input
       // By setting isManualInputMode=true, the modal should be hidden or controlled
    }
  };

  const resetScanner = () => {
    setDelivery(); // Reset to delivery/default mode
    setTableInfoState(null);
    setSearchParams({});
    setManualTableId('');
    setIsProcessing(false);
    setCameraStatus('idle');
    setIsManualInputMode(false);
    // Note: User will have to click "Authorize" again, which is good UX for resetting
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    toast({
      variant: "success",
      title: "Ajouté au panier !",
      description: `${item.name} ajouté à la commande`,
      duration: 3000,
    });
  };

  if (loadingData) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-[#D97706] h-10 w-10" /></div>;

  const isScanning = !tableParam;
  const isPermissionModalOpen = isScanning && !isManualInputMode && cameraStatus !== 'active';

  return (
    <>
      <Helmet>
        <title>{isScanning ? 'Scanner QR Code' : `Table ${tableInfoState?.table_number || tableParam} - Menu`} - La Desirade Plus</title>
      </Helmet>

      {/* Permission Modal */}
      <CameraPermissionModal 
        isOpen={isPermissionModalOpen}
        status={cameraStatus}
        onRequestPermission={requestCameraAccess}
        onManualInput={switchToManualInput}
        errorDetails={cameraErrorDetails}
      />

      <div className="min-h-screen bg-gray-50 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isScanning ? (
            // SCANNER / MANUAL INPUT VIEW
            <motion.div
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col bg-black text-white"
            >
              <header className="absolute top-0 left-0 right-0 z-20 px-4 py-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full" onClick={() => navigate('/')}>
                  <ArrowRight className="w-6 h-6 rotate-180" />
                </Button>
                <h1 className="text-lg font-bold drop-shadow-md">
                   {isManualInputMode ? "Entrée Manuelle" : "Scanner une table"}
                </h1>
                <div className="w-10"></div>
              </header>

              <div className="flex-1 relative flex flex-col items-center justify-center bg-black">
                
                {/* Camera Viewport */}
                {!isManualInputMode && (
                  <>
                     <div id="qr-reader" className="w-full h-full absolute inset-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full" style={{ overflow: 'hidden' }}></div>
                     
                     {/* Active Scanner Overlay */}
                     {cameraStatus === 'active' && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                          <div className="absolute inset-0 bg-black/50" style={{ maskImage: 'linear-gradient(to bottom, black 30%, transparent 45%, transparent 55%, black 70%)', WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 45%, transparent 55%, black 70%)' }}></div>
                          <div className="relative w-72 h-72 border-2 border-white/20 rounded-3xl overflow-hidden shadow-2xl">
                             <motion.div initial={{ top: "0%" }} animate={{ top: "100%" }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} className="absolute left-0 right-0 h-0.5 bg-[#D97706] shadow-[0_0_20px_4px_rgba(234,88,12,0.6)] z-20" />
                             {/* Corners */}
                             <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-[#D97706] rounded-tl-xl" />
                             <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-[#D97706] rounded-tr-xl" />
                             <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-[#D97706] rounded-bl-xl" />
                             <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-[#D97706] rounded-br-xl" />
                          </div>
                          <p className="mt-12 text-white/90 font-medium bg-black/60 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">Placez le QR Code dans le cadre</p>
                        </div>
                     )}
                  </>
                )}

                {/* Manual Input View */}
                {isManualInputMode && (
                   <div className="z-10 w-full max-w-md px-6 flex flex-col items-center">
                      <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                         <Keyboard className="w-10 h-10 text-[#D97706]" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Entrez le code</h2>
                      <p className="text-gray-400 text-center mb-8">
                         Le numéro de la table est indiqué sous le QR Code.
                      </p>
                      
                      <form onSubmit={handleManualSubmit} className="w-full space-y-4">
                        <Input 
                          type="text" 
                          placeholder="Ex: TABLE-5" 
                          value={manualTableId} 
                          onChange={(e) => setManualTableId(e.target.value)} 
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-500 h-14 rounded-2xl text-center text-xl font-bold focus:ring-[#D97706] focus:border-[#D97706] transition-all w-full" 
                          autoFocus
                        />
                        <Button 
                           type="submit" 
                           disabled={!manualTableId.trim()} 
                           className="w-full h-14 bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#D97706]/20"
                        >
                           Valider
                        </Button>
                      </form>

                      <Button 
                        variant="ghost" 
                        onClick={() => {
                           setIsManualInputMode(false);
                           setCameraStatus('idle'); // Reset to trigger permission modal again if needed
                        }}
                        className="mt-6 text-gray-400 hover:text-white"
                      >
                         <CameraIcon className="w-4 h-4 mr-2" /> Retour à la caméra
                      </Button>
                   </div>
                )}
              </div>

              {/* Footer Area (Only visible in Camera Mode for Manual fallback if modal is closed or user dismissed) */}
              {!isManualInputMode && cameraStatus === 'active' && (
                  <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/80 to-transparent z-20">
                     <div className="max-w-xs mx-auto text-center">
                        <Button 
                           variant="outline" 
                           onClick={() => setIsManualInputMode(true)}
                           className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl w-full h-12 backdrop-blur-md"
                        >
                           <Keyboard className="w-4 h-4 mr-2" /> Entrer le code manuellement
                        </Button>
                     </div>
                  </div>
              )}
            </motion.div>
          ) : (
            // MENU VIEW
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="pb-24 min-h-screen"
            >
              <header className="sticky top-0 z-40 bg-white px-4 py-4 flex items-center justify-between shadow-sm">
                <Button variant="ghost" size="icon" className="text-[#111827] -ml-2" onClick={() => navigate('/')}>
                   <ArrowRight className="w-6 h-6 rotate-180" />
                </Button>
                <div className="flex flex-col items-center">
                   <h1 className="text-lg font-bold text-[#111827]">Table {tableInfoState?.table_number || tableParam}</h1>
                   <button onClick={resetScanner} className="text-[10px] text-[#D97706] font-medium flex items-center gap-1 hover:underline group">
                     <ScanLine className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Scanner à nouveau
                   </button>
                </div>
                <div className="relative" onClick={() => navigate('/cart')}>
                  <Button variant="ghost" size="icon" className="text-[#111827] -mr-2">
                    <ShoppingCart className="w-6 h-6" />
                  </Button>
                  {cartItemCount > 0 && (
                    <span className="absolute top-1 right-1 bg-[#D97706] text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                      {cartItemCount}
                    </span>
                  )}
                </div>
              </header>

              <div className="bg-[#D97706] p-6 pb-12 text-white rounded-b-[30px] shadow-lg shadow-black/20">
                <h1 className="text-xl font-bold text-center">Bienvenue chez Keya</h1>
                <p className="text-white/80 text-center text-sm mt-1">Commandez directement depuis votre table</p>
              </div>

              <div className="container mx-auto px-4 -mt-8">
                {categories.map(category => {
                  const items = menuItems.filter(i => i.category_id === category.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={category.id} className="mb-8">
                      <h2 className="text-lg font-bold text-[#111827] mb-3 px-1">{category.name}</h2>
                      <div className="space-y-4">
                        {items.map((item, i) => (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200 flex gap-4">
                            <div className="h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                              {item.image_url && <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                 <h3 className="font-bold text-base text-[#111827] leading-tight">{item.name}</h3>
                                 <p className="text-xs text-[#4b5563] mt-1 line-clamp-2">{item.description}</p>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-bold text-[#D97706] text-base">{item.price} FCFA</span>
                                <Button size="sm" className="rounded-full h-8 w-8 p-0 bg-[#D97706] hover:bg-[#FCD34D] text-white" onClick={() => handleAddToCart(item)}>
                                  <Plus className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="fixed bottom-6 left-0 right-0 px-6 z-40">
                 <Button onClick={() => navigate('/cart')} className="w-full h-14 bg-[#D97706] hover:bg-[#FCD34D] text-white rounded-2xl font-bold text-base shadow-xl shadow-black/20">
                   Voir ma commande ({cartItemCount})
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default QRMenuPage;