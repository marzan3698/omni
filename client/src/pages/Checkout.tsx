import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useShop } from '@/contexts/ShopContext';
import { projectApi, paymentGatewayApi, bkashApi, serviceApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart, 
  ChevronRight, 
  Trash2, 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Loader2,
  Wallet,
  Phone,
  Hash,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getStaticFileUrl } from '@/lib/utils';

interface PaymentGateway {
  id: number;
  name: string;
  accountType: string;
  accountNumber: string;
  instructions?: string;
}

export function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, addToCart, clearCart } = useShop();
  const { user, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // New State for Name and Payments
  const [fullName, setFullName] = useState(user?.name || '');
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [isLoadingGateways, setIsLoadingGateways] = useState(true);

  // Fetch Recommended Services
  const { data: recommendedServicesResponse } = useQuery({
    queryKey: ['services', 'recommended'],
    queryFn: async () => {
      const response = await serviceApi.getAll(true);
      return response.data.data || [];
    },
  });

  const recommendedServices = (recommendedServicesResponse || [])
    .filter((s: any) => !cart.some(cartItem => cartItem.id === s.id))
    .slice(0, 4);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const response = await paymentGatewayApi.getActive();
        const apiData = response.data;
        if (apiData.success) {
          setGateways(apiData.data);
        }
      } catch (error) {
        console.error('Failed to fetch gateways:', error);
      } finally {
        setIsLoadingGateways(false);
      }
    };
    fetchGateways();
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + Number(item.pricing), 0);
  const total = subtotal;

  const selectedGateway = gateways.find(g => g.id.toString() === selectedGatewayId);
  const isAutomatic = selectedGateway?.name.toLowerCase().includes('(auto)');

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the Terms & Conditions');
      return;
    }

    if (!fullName.trim()) {
      alert('Please enter your full name');
      return;
    }

    // Optional Payment validation if a manual gateway is selected
    if (selectedGatewayId && !isAutomatic) {
      if (!transactionId.trim()) {
        alert('Please enter the Transaction ID for your payment');
        return;
      }
      
      if (paidBy.trim()) {
        const accountNumberRegex = /^(\+88)?01[3-9]\d{8}$/;
        if (!accountNumberRegex.test(paidBy.trim())) {
          alert('Invalid "Paid From" number. Must be a valid Bangladesh mobile number.');
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      const serviceIds = cart.map(item => item.id);
      
      const payload: any = {
        serviceIds,
        clientName: fullName,
        companyName,
        address,
      };

      // Only add manual payment details if it's NOT automatic
      if (selectedGatewayId && !isAutomatic) {
        payload.payment = {
          gatewayId: parseInt(selectedGatewayId),
          transactionId: transactionId.trim(),
          amount: total,
          paidBy: paidBy.trim() || undefined,
        };
      }

      const response = await projectApi.checkout(payload);
      const checkoutData = response.data;

      if (checkoutData.success) {
        const { results = [], errors = [] } = checkoutData.data || {};
        const successResults = Array.isArray(checkoutData.data) ? checkoutData.data : results;

        // If automatic payment is selected and we have at least one invoice
        if (isAutomatic && successResults.length > 0) {
          const firstResult = successResults[0];
          const invoiceId = firstResult.invoice?.id;

          if (invoiceId) {
            try {
              // Call bKash Create API
              const bkashResponse = await bkashApi.createPayment({
                invoiceId,
                amount: total
              });
              
              const bkashData = bkashResponse.data;
              if (bkashData.success && bkashData.data?.bkashURL) {
                // Clear cart and redirect to bKash
                clearCart();
                window.location.href = bkashData.data.bkashURL;
                return;
              }
            } catch (bkashError: any) {
              console.error('bKash redirect failed:', bkashError);
              alert('Redirect to bKash failed. You can pay later from your invoice page.');
            }
          }
        }

        // If there were any errors during payment recording for manual payment
        if (errors.length > 0) {
          const errorMsg = errors.map((e: any) => e.message).join('\n');
          alert(`Order placed, but there were issues: \n${errorMsg}\n\nPlease contact support or check your invoices.`);
        }

        // For manual gateways or if automatic payment redirect failed, refresh profile and go to success
        await refreshProfile();
        clearCart();
        
        const firstInvoiceId = successResults.length > 0 ? successResults[0].invoice?.id : undefined;
        navigate(firstInvoiceId ? `/client/invoices/success/${firstInvoiceId}` : '/client/checkout/success');
      }
    } catch (error: any) {
      console.error('Checkout failed:', error);
      alert(error?.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
          <ShoppingCart className="w-12 h-12 text-slate-500" />
        </div>
        <h2 className="text-3xl font-bold text-amber-100 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-400 mb-8 max-w-md">Looks like you haven't added any services to your cart yet. Explore our premium services to get started.</p>
        <Button 
          onClick={() => navigate('/client')} 
          className="bg-amber-500 text-slate-900 hover:bg-amber-400 font-bold px-8 h-12 rounded-xl"
        >
          Browse Services
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-slate-400 hover:text-amber-500 transition-colors mb-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Shop
          </button>
          <h1 className="text-4xl font-black text-amber-100 flex items-center gap-3">
            Secure Checkout
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-4 py-2 px-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider">SSL Secured Checkout</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Review */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/40 border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8">
              <h2 className="text-xl font-bold text-amber-100 mb-8 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Review Your Services
              </h2>
              
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="group relative flex gap-6 p-4 rounded-3xl bg-slate-800/30 border border-slate-800 hover:border-amber-500/20 transition-all duration-300">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700">
                      {item.thumbnailType === 'IMAGE' ? (
                        <img 
                          src={getStaticFileUrl(item.thumbnailUrl)} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <FileText className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-lg font-bold text-amber-100 group-hover:text-amber-400 transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-2.5 py-1 bg-slate-800/50 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                            {item.deliveryTime || '7 Days'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 px-2.5 py-1 bg-slate-800/50 rounded-lg uppercase tracking-tighter">
                            <CreditCard className="w-3.5 h-3.5 text-amber-500/70" />
                            {item.priceType || 'One Time'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xl font-black text-amber-500">৳{Number(item.pricing).toLocaleString()}</span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="bg-slate-900/40 border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8">
              <h2 className="text-xl font-bold text-amber-100 mb-8 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="h-14 px-5 bg-slate-800/40 border-slate-700/50 rounded-2xl text-slate-100 font-medium focus:ring-amber-500/20 focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="h-14 px-5 flex items-center bg-slate-800/40 border border-slate-700/50 rounded-2xl text-slate-500 font-medium cursor-not-allowed">
                    {user?.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Company Name (Optional)</label>
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="h-14 px-5 bg-slate-800/40 border-slate-700/50 rounded-2xl text-slate-100 font-medium focus:ring-amber-500/20 focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Location / Address (Optional)</label>
                  <Input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your location or address"
                    className="h-14 px-5 bg-slate-800/40 border-slate-700/50 rounded-2xl text-slate-100 font-medium focus:ring-amber-500/20 focus:border-amber-500/50"
                  />
                </div>
              </div>
              <p className="mt-6 text-slate-500 text-sm italic">
                * Your name will be updated in our records. Projects will be linked to this identity.
              </p>
            </div>
          </Card>

          {/* Payment Information */}
          <Card className="bg-slate-900/40 border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8">
              <h2 className="text-xl font-bold text-amber-100 mb-8 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-amber-500" />
                Payment Information
              </h2>
              
              <div className="space-y-8">
                {/* Gateway Selection */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Select Payment Method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {isLoadingGateways ? (
                      <div className="col-span-full py-10 flex justify-center">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      </div>
                    ) : gateways.map((gateway) => (
                      <button
                        key={gateway.id}
                        onClick={() => setSelectedGatewayId(gateway.id.toString())}
                        className={cn(
                          "relative p-4 rounded-2xl border-2 transition-all group flex flex-col items-center gap-2",
                          selectedGatewayId === gateway.id.toString()
                            ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10"
                            : "bg-slate-800/40 border-slate-700/50 hover:border-amber-500/30"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          selectedGatewayId === gateway.id.toString() ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-slate-300 group-hover:bg-slate-600"
                        )}>
                          {gateway.name.toLowerCase().includes('bkash') ? (
                            <img src="https://path-to-bkash-logo.png" className="w-8 h-8 object-contain" alt="bkash" onError={(e) => {
                              // Fallback if image fails
                              (e.target as any).src = "https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg";
                            }} />
                          ) : (
                            <Wallet className="w-5 h-5" />
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-bold",
                          selectedGatewayId === gateway.id.toString() ? "text-amber-500" : "text-slate-400 group-hover:text-slate-200"
                        )}>
                          {gateway.name}
                        </span>
                        {selectedGatewayId === gateway.id.toString() && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gateway Details & Instructions */}
                {selectedGateway && (
                  <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-500/20 rounded-xl">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-amber-100 font-bold mb-1">
                          {isAutomatic ? 'Automatic Payment Selected' : 'Payment Instructions'}
                        </h4>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {isAutomatic 
                            ? `You will be redirected to the secure bKash payment gateway to pay ৳${total.toLocaleString()}.` 
                            : `Please send exactly ৳${total.toLocaleString()} to the ${selectedGateway.name} (${selectedGateway.accountType}) number below:`
                          }
                        </p>
                        
                        {!isAutomatic && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-2xl font-black text-amber-500 tracking-wider">
                              {selectedGateway.accountNumber}
                            </span>
                            <Button variant="outline" size="sm" className="h-8 rounded-lg border-amber-500/30 text-amber-500 hover:bg-amber-500/10" onClick={() => {
                              navigator.clipboard.writeText(selectedGateway.accountNumber);
                              alert('Number copied!');
                            }}>Copy</Button>
                          </div>
                        )}

                        {selectedGateway.instructions && !isAutomatic && (
                          <p className="mt-3 text-slate-500 text-xs italic">
                            Note: {selectedGateway.instructions}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isAutomatic && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5" /> Paid From Number
                          </label>
                          <Input 
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
                            placeholder="e.g. 01XXXXXXXXX"
                            className="h-12 px-4 bg-slate-900/60 border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-amber-500/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                            <Hash className="w-3.5 h-3.5" /> Transaction ID
                          </label>
                          <Input 
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Enter Transaction ID"
                            className="h-12 px-4 bg-slate-900/60 border-slate-700/50 rounded-xl text-slate-100 placeholder:text-slate-600 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!selectedGatewayId && (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 text-center">
                    <Wallet className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Please select a payment method to continue</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-8 bg-slate-900 border-amber-500/20 rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-500/5">
            <div className="p-8">
              <h2 className="text-xl font-black text-amber-100 mb-8 uppercase tracking-widest">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">Subtotal ({cart.length} items)</span>
                  <span className="font-bold text-slate-200">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-medium">Tax / Processing</span>
                  <span className="font-bold text-emerald-500">FREE</span>
                </div>
                <div className="h-px bg-slate-800 my-6" />
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest block mb-1">Total Amount</span>
                    <span className="text-4xl font-black text-amber-100">৳{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* T&C Component */}
              <div className="group mb-8 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-amber-500/30 transition-all cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                <div className="flex gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all",
                    agreedToTerms ? "bg-amber-500 border-amber-500 shadow-lg shadow-amber-500/20" : "border-slate-600 group-hover:border-amber-500/50"
                  )}>
                    {agreedToTerms && <CheckCircle2 className="w-4 h-4 text-slate-900 font-bold" />}
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors">
                    I agree to the <span className="text-amber-500 font-bold hover:underline">Terms of Service</span> and authorize the creation of these projects.
                  </p>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !agreedToTerms}
                className={cn(
                  "w-full h-20 text-xl font-black rounded-2xl transition-all duration-300 relative overflow-hidden group",
                  agreedToTerms 
                    ? "bg-amber-500 text-slate-900 hover:bg-amber-400 hover:scale-[1.02] shadow-xl shadow-amber-500/20" 
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {isAutomatic ? 'Redirecting...' : 'Processing...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    {isAutomatic ? 'Pay Now with bKash' : 'Place Order Now'}
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </Button>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-slate-500 group">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Secure Payment Gateway</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 group">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Instant Project Setup</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Similar Products Section */}
      {recommendedServices.length > 0 && (
        <div className="mt-16 pb-12">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-amber-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-500" />
              Complete Your Strategy
            </h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recommendedServices.map((service: any) => (
              <div 
                key={service.id} 
                className="group bg-slate-900/40 border border-slate-800 rounded-2xl p-3 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="aspect-video rounded-xl overflow-hidden bg-slate-800 mb-3 relative">
                  {service.thumbnailUrl ? (
                    <img 
                      src={getStaticFileUrl(service.thumbnailUrl)} 
                      alt={service.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-700" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-900 flex justify-between items-end">
                    <span className="text-[10px] font-black text-amber-500 tracking-tighter">৳{Number(service.pricing).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[13px] font-bold text-amber-100 line-clamp-1 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{service.title}</h4>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => addToCart(service)}
                    className="w-full h-8 rounded-lg border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest gap-2"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
