import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import { Button } from '@/components/ui/button';
import { cn, getStaticFileUrl } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function CartDrawer() {
  const { cart, removeFromCart, isCartOpen, setIsCartOpen, clearCart } = useShop();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + Number(item.pricing), 0);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/client/checkout');
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700">
          <div className="flex h-full flex-col overflow-y-scroll bg-slate-900 shadow-2xl border-l border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6 text-amber-500" />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Your Cart</h2>
                <span className="flex items-center justify-center bg-amber-500 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full">
                  {cart.length}
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Your cart is empty</h3>
                  <p className="text-slate-500 max-w-[240px]">
                    Looks like you haven't added any premium services yet.
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 text-amber-500 font-bold"
                  >
                    Start Browsing <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div 
                      key={item.id} 
                      className="group flex gap-4 p-4 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-amber-500/20 transition-all"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-700">
                        {item.thumbnailUrl ? (
                          <img 
                            src={getStaticFileUrl(item.thumbnailUrl)} 
                            className="w-full h-full object-cover"
                            alt="" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-slate-700" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{item.category?.name}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-amber-500 font-black">৳{Number(item.pricing).toLocaleString()}</span>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={clearCart}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Clear All Items
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="text-2xl font-black text-white">৳{total.toLocaleString()}</span>
                </div>
                <Button 
                  onClick={handleCheckout}
                  className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-lg font-black shadow-xl shadow-amber-500/20"
                >
                  Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-bold">
                  Secure Checkout Guaranteed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
