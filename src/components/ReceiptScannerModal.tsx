import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../i18n/LanguageContext';
import { scanReceiptImage } from '../services/receiptService';
import { ExtractedReceiptData, Category } from '../types';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Receipt,
  RotateCw,
  ArrowRight,
  Edit3,
  Calendar,
  DollarSign,
  Tag,
  Building,
  ListOrdered,
  Eye,
  Zap,
} from 'lucide-react';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (extracted: ExtractedReceiptData) => void;
}

// Sample receipt images (Data URIs of realistic SVG receipts for instant 1-click testing)
const SAMPLE_RECEIPTS = [
  {
    name: 'Whole Foods Groceries',
    category: 'Groceries',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" style="background:#fdfcf7;font-family:monospace;color:#111;">
        <rect width="100%" height="100%" fill="#fffbf0"/>
        <text x="50%" y="45" font-size="20" font-weight="bold" text-anchor="middle" fill="#0b522c">WHOLE FOODS MARKET</text>
        <text x="50%" y="68" font-size="12" text-anchor="middle" fill="#555">Store #1042 • 500 Lamar Blvd</text>
        <text x="50%" y="85" font-size="12" text-anchor="middle" fill="#555">Austin, TX 78703</text>
        <line x1="20" y1="100" x2="380" y2="100" stroke="#888" stroke-dasharray="4"/>
        
        <text x="25" y="125" font-size="13" font-weight="bold">DATE: 2026-09-22</text>
        <text x="375" y="125" font-size="13" text-anchor="end">TIME: 14:32</text>
        <text x="25" y="145" font-size="12" fill="#666">CASHIER: Maya • REG #04</text>
        <line x1="20" y1="160" x2="380" y2="160" stroke="#888" stroke-dasharray="4"/>
        
        <text x="25" y="190" font-size="13">ORGANIC ALMOND MILK</text>
        <text x="375" y="190" font-size="13" text-anchor="end">$4.49</text>
        
        <text x="25" y="215" font-size="13">SOURDOUGH ARTISAN BREAD</text>
        <text x="375" y="215" font-size="13" text-anchor="end">$6.25</text>
        
        <text x="25" y="240" font-size="13">AVOCADOS 4-PACK HASS</text>
        <text x="375" y="240" font-size="13" text-anchor="end">$5.99</text>
        
        <text x="25" y="265" font-size="13">WILD CAUGHT SALMON FILLET</text>
        <text x="375" y="265" font-size="13" text-anchor="end">$18.80</text>
        
        <text x="25" y="290" font-size="13">GREEK HONEY YOGURT 32OZ</text>
        <text x="375" y="290" font-size="13" text-anchor="end">$5.49</text>
        
        <line x1="20" y1="320" x2="380" y2="320" stroke="#888" stroke-dasharray="4"/>
        <text x="25" y="345" font-size="13">SUBTOTAL</text>
        <text x="375" y="345" font-size="13" text-anchor="end">$41.02</text>
        
        <text x="25" y="370" font-size="13">SALES TAX (8.25%)</text>
        <text x="375" y="370" font-size="13" text-anchor="end">$3.38</text>
        
        <line x1="20" y1="395" x2="380" y2="395" stroke="#111" stroke-width="2"/>
        <text x="25" y="425" font-size="18" font-weight="bold">TOTAL AMOUNT</text>
        <text x="375" y="425" font-size="20" font-weight="bold" text-anchor="end">$44.40</text>
        <line x1="20" y1="440" x2="380" y2="440" stroke="#111" stroke-width="2"/>
        
        <text x="25" y="470" font-size="12">VISA SIGNATURE **** 8821</text>
        <text x="375" y="470" font-size="12" text-anchor="end">AUTH #99401</text>
        
        <text x="50%" y="530" font-size="12" text-anchor="middle" fill="#555">THANK YOU FOR SHOPPING NATURAL!</text>
        <text x="50%" y="550" font-size="11" text-anchor="middle" fill="#888">www.wholefoodsmarket.com</text>
      </svg>
    `),
  },
  {
    name: 'Blue Bottle Cafe',
    category: 'Food & Dining',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520" style="background:#fdfcf7;font-family:monospace;color:#111;">
        <rect width="100%" height="100%" fill="#faf8f5"/>
        <text x="50%" y="45" font-size="19" font-weight="bold" text-anchor="middle" fill="#0072ce">BLUE BOTTLE COFFEE</text>
        <text x="50%" y="68" font-size="11" text-anchor="middle" fill="#666">Mint Plaza • San Francisco, CA</text>
        <line x1="20" y1="90" x2="380" y2="90" stroke="#aaa" stroke-dasharray="3"/>
        
        <text x="25" y="115" font-size="13">DATE: 2026-09-23</text>
        <text x="375" y="115" font-size="13" text-anchor="end">10:15 AM</text>
        <line x1="20" y1="135" x2="380" y2="135" stroke="#aaa" stroke-dasharray="3"/>
        
        <text x="25" y="165" font-size="13">1x BELLA DONOVAN POUR OVER</text>
        <text x="375" y="165" font-size="13" text-anchor="end">$6.50</text>
        
        <text x="25" y="195" font-size="13">1x OAT MILK FLAT WHITE</text>
        <text x="375" y="195" font-size="13" text-anchor="end">$7.25</text>
        
        <text x="25" y="225" font-size="13">1x ALMOND CROISSANT</text>
        <text x="375" y="225" font-size="13" text-anchor="end">$5.50</text>
        
        <line x1="20" y1="260" x2="380" y2="260" stroke="#bbb" stroke-dasharray="3"/>
        <text x="25" y="285" font-size="13">SUBTOTAL</text>
        <text x="375" y="285" font-size="13" text-anchor="end">$19.25</text>
        
        <text x="25" y="310" font-size="13">TAX</text>
        <text x="375" y="310" font-size="13" text-anchor="end">$1.64</text>
        
        <text x="25" y="335" font-size="13">TIP</text>
        <text x="375" y="335" font-size="13" text-anchor="end">$3.00</text>
        
        <line x1="20" y1="360" x2="380" y2="360" stroke="#111" stroke-width="2"/>
        <text x="25" y="390" font-size="18" font-weight="bold">TOTAL</text>
        <text x="375" y="390" font-size="20" font-weight="bold" text-anchor="end">$23.89</text>
        <line x1="20" y1="405" x2="380" y2="405" stroke="#111" stroke-width="2"/>
        
        <text x="25" y="440" font-size="12">APPLE PAY (MASTERCARD 4120)</text>
        <text x="50%" y="485" font-size="12" text-anchor="middle" fill="#666">ENJOY YOUR BREW!</text>
      </svg>
    `),
  },
  {
    name: 'Office Depot & IT Supplies',
    category: 'Software & SaaS Tools',
    dataUrl:
      'data:image/svg+xml;utf8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520" style="background:#fdfcf7;font-family:monospace;color:#111;">
        <rect width="100%" height="100%" fill="#f9f9f9"/>
        <text x="50%" y="45" font-size="20" font-weight="bold" text-anchor="middle" fill="#cc0000">OFFICE DEPOT</text>
        <text x="50%" y="68" font-size="11" text-anchor="middle" fill="#555">Commercial Business Supplies #442</text>
        <line x1="20" y1="90" x2="380" y2="90" stroke="#aaa" stroke-dasharray="3"/>
        
        <text x="25" y="115" font-size="13">DATE: 2026-09-20</text>
        <text x="375" y="115" font-size="13" text-anchor="end">ORDER: #B2B-8931</text>
        <line x1="20" y1="135" x2="380" y2="135" stroke="#aaa" stroke-dasharray="3"/>
        
        <text x="25" y="165" font-size="13">USB-C DUAL 4K DOCKING HUB</text>
        <text x="375" y="165" font-size="13" text-anchor="end">$89.99</text>
        
        <text x="25" y="195" font-size="13">CAT-6 ETHERNET PACK (5X)</text>
        <text x="375" y="195" font-size="13" text-anchor="end">$24.50</text>
        
        <text x="25" y="225" font-size="13">RECYCLED COPY PAPER (3-REAM)</text>
        <text x="375" y="225" font-size="13" text-anchor="end">$22.00</text>
        
        <line x1="20" y1="260" x2="380" y2="260" stroke="#bbb" stroke-dasharray="3"/>
        <text x="25" y="285" font-size="13">SUBTOTAL</text>
        <text x="375" y="285" font-size="13" text-anchor="end">$136.49</text>
        
        <text x="25" y="310" font-size="13">SALES TAX</text>
        <text x="375" y="310" font-size="13" text-anchor="end">$11.26</text>
        
        <line x1="20" y1="340" x2="380" y2="340" stroke="#111" stroke-width="2"/>
        <text x="25" y="375" font-size="18" font-weight="bold">TOTAL BALANCE</text>
        <text x="375" y="375" font-size="20" font-weight="bold" text-anchor="end">$147.75</text>
        <line x1="20" y1="390" x2="380" y2="390" stroke="#111" stroke-width="2"/>
        
        <text x="25" y="425" font-size="12">CORPORATE CARD **** 9012</text>
        <text x="50%" y="475" font-size="12" text-anchor="middle" fill="#666">BUSINESS TAX INVOICE</text>
      </svg>
    `),
  },
];

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addTransaction, currency, mode, addToast } = useFinance();
  const { t } = useLanguage();

  // Camera & Video State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Analysis State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const [autoAdd, setAutoAdd] = useState<boolean>(true);
  const [isAdded, setIsAdded] = useState<boolean>(false);

  // Editable fields for review before saving if requested
  const [editMerchant, setEditMerchant] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access API is not supported in this browser environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access could not be acquired:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in browser permissions or upload an image file.'
          : err.message || 'Unable to access camera.'
      );
    }
  }, [cameraFacing, stream]);

  // Toggle Camera on modal open / close
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setExtractedData(null);
      setIsAdded(false);
      setIsEditing(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Flip Front/Back Camera
  const handleFlipCamera = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Re-start camera when facing mode changes
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
  }, [cameraFacing]);

  // Capture Photo from Live Video Feed
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    stopCamera();

    // Trigger AI Scan
    processReceiptImage(dataUrl);
  };

  // Process Receipt with Gemini AI OCR
  const processReceiptImage = async (dataUrl: string) => {
    setIsScanning(true);
    setExtractedData(null);
    setIsAdded(false);

    try {
      setScanStep('Sending receipt image to Gemini 3.8 Flash...');
      const extracted = await scanReceiptImage(dataUrl, 'image/jpeg', mode);

      setScanStep('Extraction complete! Categorizing expense...');
      setExtractedData(extracted);

      // Populate editable fields
      const formattedDate =
        extracted.date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.date)
          ? extracted.date
          : new Date().toISOString().split('T')[0];

      const cleanAmount =
        typeof extracted.totalAmount === 'number' && !isNaN(extracted.totalAmount)
          ? extracted.totalAmount
          : 0;

      const cleanCategory = extracted.category || (mode === 'sme' ? 'Office Rent & Utilities' : 'Shopping');

      const itemsSummary = extracted.lineItems && extracted.lineItems.length > 0
        ? `Items: ${extracted.lineItems.map((i) => `${i.description} ($${i.amount || 0})`).join(', ')}`
        : '';
      const notes = [
        `[Scanned Receipt: ${extracted.merchant || 'Store'}]`,
        extracted.paymentMethod ? `Paid via ${extracted.paymentMethod}` : '',
        extracted.taxAmount ? `Tax: $${extracted.taxAmount}` : '',
        itemsSummary,
      ]
        .filter(Boolean)
        .join(' • ');

      setEditMerchant(extracted.merchant || 'Unknown Merchant');
      setEditDate(formattedDate);
      setEditAmount(cleanAmount.toString());
      setEditCategory(cleanCategory);
      setEditNotes(notes);

      // Auto-add to ledger if enabled
      if (autoAdd && cleanAmount > 0) {
        addTransaction({
          date: formattedDate,
          description: extracted.merchant || 'Scanned Receipt',
          amount: cleanAmount,
          type: 'Expense',
          category: cleanCategory as Category,
          notes,
          isBusiness: mode === 'sme',
        });
        setIsAdded(true);

        addToast({
          type: 'success',
          title: t('scanner.extractedSuccess') || 'Receipt Scanned!',
          message: `${extracted.merchant || 'Receipt'} (${currency}${cleanAmount.toFixed(2)}) auto-added to transactions on ${formattedDate}.`,
        });

        if (onSuccess) {
          onSuccess(extracted);
        }
      }
    } catch (err: any) {
      console.error('Scan receipt failed:', err);
      addToast({
        type: 'error',
        title: 'Receipt Scan Failed',
        message: err.message || 'Could not analyze receipt photo. Please try a clearer shot.',
      });
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Handle File Upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCapturedImage(dataUrl);
        stopCamera();
        processReceiptImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert SVG Data URL to high-resolution JPEG Data URL
  const convertSvgToJpegDataUrl = (svgDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.95));
        } else {
          resolve(svgDataUrl);
        }
      };
      img.onerror = () => resolve(svgDataUrl);
      img.src = svgDataUrl;
    });
  };

  // Handle Preset Sample Receipt click
  const handleSelectSample = async (sampleDataUrl: string) => {
    const jpegUrl = await convertSvgToJpegDataUrl(sampleDataUrl);
    setCapturedImage(jpegUrl);
    stopCamera();
    processReceiptImage(jpegUrl);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setIsAdded(false);
    setIsEditing(false);
    startCamera();
  };

  // Manual save if autoAdd was unchecked or user edited fields
  const handleManualSave = () => {
    const amountVal = parseFloat(editAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      addToast({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Please enter a valid expense total amount.',
      });
      return;
    }

    addTransaction({
      date: editDate || new Date().toISOString().split('T')[0],
      description: editMerchant || 'Scanned Receipt',
      amount: amountVal,
      type: 'Expense',
      category: (editCategory as Category) || (mode === 'sme' ? 'Office Rent & Utilities' : 'Shopping'),
      notes: editNotes,
      isBusiness: mode === 'sme',
    });

    setIsAdded(true);
    addToast({
      type: 'success',
      title: 'Transaction Saved',
      message: `${editMerchant} (${currency}${amountVal.toFixed(2)}) recorded into your ledger.`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {t('scanner.modalTitle') || 'Scan Physical Receipt'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('scanner.modalSubtitle') || 'Extract merchant, date, and total amount to auto-record your transaction.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Viewfinder / Preview Area */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[300px] sm:min-h-[360px]">
            {/* Live Camera Feed */}
            {!capturedImage && cameraActive && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover max-h-[400px]"
                />

                {/* Receipt Optical Alignment Overlay */}
                <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-white/40 rounded-xl flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-sm"></div>
                    <div className="w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-sm"></div>
                  </div>
                  <div className="text-center bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium py-1 px-3 rounded-full self-center">
                    {t('scanner.cameraPrompt') || 'Position receipt clearly within the alignment guide'}
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-sm"></div>
                    <div className="w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-sm"></div>
                  </div>
                </div>

                {/* Camera Top Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFlipCamera}
                    title={t('scanner.switchCamera') || 'Flip Camera'}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs border border-white/20 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="relative w-full flex items-center justify-center p-3 max-h-[380px] bg-slate-900">
                <img
                  src={capturedImage}
                  alt="Captured receipt preview"
                  className="max-h-[340px] rounded-xl object-contain shadow-md border border-slate-700"
                />

                {/* Scanning Laser Animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl flex items-center justify-center bg-blue-950/30 backdrop-blur-2xs">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse"></div>
                  </div>
                )}
              </div>
            )}

            {/* Camera Permission / Error Fallback */}
            {!capturedImage && !cameraActive && (
              <div className="p-8 text-center max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-700">
                  <Camera className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {cameraError ? 'Camera Unavailable' : 'Camera Ready'}
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  {cameraError || t('scanner.cameraError') || 'Grant camera permission or upload a receipt photo.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Try Camera Again</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t('scanner.uploadPhoto') || 'Upload File'}</span>
                  </button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Action Buttons & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {!capturedImage && cameraActive && (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('scanner.takePhoto') || 'Capture Receipt'}</span>
                </button>
              )}

              {capturedImage && (
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t('scanner.retakePhoto') || 'Retake'}</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t('scanner.uploadPhoto') || 'Upload Photo'}</span>
              </button>
            </div>

            {/* Auto-Add Switch */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAdd}
                onChange={(e) => setAutoAdd(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {t('scanner.autoAddToggle') || 'Auto-record to ledger immediately upon scan'}
              </span>
            </label>
          </div>

          {/* Quick Demo Sample Receipts (for instant testing without paper receipts) */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-blue-500" />
                <span>Instant Demo: Try with Sample Receipts</span>
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">1-Click Test</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_RECEIPTS.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample.dataUrl)}
                  disabled={isScanning}
                  className="p-2 rounded-xl text-left bg-white dark:bg-slate-800 hover:bg-blue-50/50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-all group flex items-center justify-between"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {sample.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{sample.category}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Progress / Scanning Status */}
          {isScanning && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center animate-in fade-in duration-200">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                  {t('scanner.analyzingReceipt') || 'AI Extracting Merchant, Date & Total...'}
                </span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">{scanStep}</p>
            </div>
          )}

          {/* Extracted Transaction Summary Card */}
          {extractedData && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Extraction Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('scanner.extractedSuccess') || 'Receipt Extracted Successfully'}
                    </h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {isAdded
                        ? t('scanner.autoAddedSuccess') || 'Transaction recorded into ledger'
                        : 'Ready for ledger insertion'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {extractedData.confidence && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {extractedData.confidence} Confidence
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title={t('scanner.editBeforeSave') || 'Edit Details'}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Read-Only Extracted Key Figures */}
              {!isEditing ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-750">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Building className="w-3 h-3 text-blue-500" />
                      {t('scanner.merchant') || 'Merchant'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                      {editMerchant}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-750">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-emerald-500" />
                      {t('scanner.date') || 'Date'}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                      {editDate}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-750">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-rose-500" />
                      {t('scanner.totalAmount') || 'Total Amount'}
                    </span>
                    <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 block">
                      {currency}
                      {parseFloat(editAmount || '0').toFixed(2)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-750">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-500" />
                      {t('scanner.category') || 'Category'}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate block">
                      {editCategory}
                    </span>
                  </div>
                </div>
              ) : (
                /* Editable Form */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {t('scanner.merchant') || 'Merchant / Vendor'}
                    </label>
                    <input
                      type="text"
                      value={editMerchant}
                      onChange={(e) => setEditMerchant(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {t('scanner.date') || 'Purchase Date (YYYY-MM-DD)'}
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {t('scanner.totalAmount') || 'Total Amount'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {t('scanner.category') || 'Category'}
                    </label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Line Items Preview if available */}
              {extractedData.lineItems && extractedData.lineItems.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-750">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
                    <ListOrdered className="w-3 h-3 text-blue-500" />
                    {t('scanner.lineItems') || 'Line Items Detected'} ({extractedData.lineItems.length})
                  </span>
                  <div className="max-h-24 overflow-y-auto space-y-1 text-xs">
                    {extractedData.lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-slate-600 dark:text-slate-300 py-0.5 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-750"
                      >
                        <span className="truncate">{item.description}</span>
                        {item.amount ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-200 ml-2">
                            ${item.amount.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 mt-2 border-t border-slate-100 dark:border-slate-700">
                {!isAdded ? (
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('scanner.addToLedger') || 'Add to Ledger'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Recorded in Ledger
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>High-precision receipt digitization powered by Gemini multimodal vision</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            {t('common.cancel') || 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
