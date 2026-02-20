import { useState } from 'react';
import { GamePanel } from '@/components/GamePanel';
import { Button } from '@/components/ui/button';
import { HelpCircle, ChevronDown, Copy, Check, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─── Shared Components ───────────────────────────────────────────────────────

const SectionHeader = ({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-amber-500/20 rounded-xl overflow-hidden mb-6 bg-slate-900/50 backdrop-blur-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-800/80 p-4 flex items-center justify-between hover:bg-slate-700/80 transition-colors"
            >
                <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
                    {title}
                </h2>
                <ChevronDown className={`w-5 h-5 text-amber-500/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="p-6 text-slate-300 space-y-4">{children}</div>}
        </div>
    );
};

const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative mt-2 mb-4 group rounded-lg overflow-hidden border border-amber-500/20 bg-[#0f172a]">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 bg-slate-800/80 border-amber-500/30 hover:bg-slate-700 hover:border-amber-500/50"
                    onClick={copyToClipboard}
                >
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-amber-400/70" />}
                </Button>
            </div>
            <div className="flex items-center px-4 py-2 bg-slate-900 border-b border-amber-500/20">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                </div>
                <span className="ml-4 text-xs font-mono text-amber-500/50 uppercase">{language}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono text-slate-300">
                <code>{code}</code>
            </pre>
        </div>
    );
};

const ImportantNote = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg my-4 flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200/90 leading-relaxed">{children}</div>
    </div>
);

const SuccessBox = ({ children }: { children: React.ReactNode }) => (
    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg my-4 flex gap-3 items-start relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-200/90 leading-relaxed">{children}</div>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdvancedWhatsappSetup() {
    return (
        <div className="min-h-screen bg-[#020817] text-slate-300 p-4 lg:p-8 font-sans">
            <GamePanel className="max-w-4xl mx-auto space-y-6 pt-10 px-4 sm:px-8 pb-10">

                <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-6 text-center shadow-lg shadow-amber-500/5">
                    <Server className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-bold text-amber-400 mb-2">
                        হোস্টিং সার্ভারে WhatsApp Web.js সমস্যা ও সমাধান
                    </h1>
                    <p className="text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        cPanel বা শেয়ারিং হোস্টিংয়ে Puppeteer (Google Chrome) ফিজিক্যালি রান করা অনেক সময় ফায়ারওয়াল (CageFS / LVE Limits) ব্লক করে দেয়। তাই আমরা <strong>Browserless.io</strong> ক্লাউড সার্ভিস ব্যবহার করেছি, যাতে সার্ভারে চাপ না পড়ে।
                    </p>
                </div>

                <SectionHeader title="১. কেন Browserless.io ব্যবহার করতে হবে?">
                    <div className="space-y-4 text-sm leading-relaxed">
                        <p>
                            সাধারণত <code>whatsapp-web.js</code> ব্যাকগ্রাউন্ডে আস্ত একটি Chrome ব্রাউজার রান করে। কিন্তু <strong>cPanel</strong> এর মতো শেয়ারিং সার্ভারে বেশি RAM/CPU খরচ হলে হোস্টিং প্রোভাইডার ব্রাউজারটিকে কিল (Kill) করে দেয়। ফলে নিচে দেয়া Error গুলো আসতে পারে:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-slate-400 ml-2">
                            <li><strong className="text-red-400">Timeout Error:</strong> ব্রাউজার ওপেন হতে অনেক সময় লাগলে।</li>
                            <li><strong className="text-red-400">ECONNRESET:</strong> সার্ভারের ফায়ারওয়াল (ModSecurity) ব্রাউজারের Websocket ব্লক করে দিলে।</li>
                            <li><strong className="text-red-400">Protocol error (Target.setDiscoverTargets) Target closed:</strong> LVE Manager বা CageFS ব্রাউজারটিকে জোর করে কিল করলে।</li>
                        </ul>
                        <ImportantNote>
                            <strong>স্থায়ী সমাধান:</strong> cPanel-এ ব্রাউজার রান না করে ক্লাউডে (Browserless.io) ব্রাউজার রান করা। এতে আপনার হোস্টিংয়ে কোনো প্রেশার পড়বে না।
                        </ImportantNote>
                    </div>
                </SectionHeader>

                <SectionHeader title="২. Browserless Account তৈরি ও API Key সংগ্রহ">
                    <div className="space-y-6 text-sm">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                                A
                            </div>
                            <div>
                                <h3 className="text-amber-300 font-bold mb-1 text-base">অ্যাকাউন্ট খুলুন</h3>
                                <p className="text-slate-400">
                                    <a href="https://www.browserless.io/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">browserless.io</a> ওয়েবসাইটে যান। "Start Free" বা "Sign Up" এ ক্লিক করে একটি ফ্রি একাউন্ট তৈরি করুন (Google দিয়ে লগিন করা সহজ)।
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold flex-shrink-0">
                                B
                            </div>
                            <div>
                                <h3 className="text-amber-300 font-bold mb-1 text-base">API Key কপি করুন</h3>
                                <p className="text-slate-400 mb-2">
                                    একাউন্টে লগিন করার পর ড্যাশবোর্ডে <strong>API Key</strong> নামক একটি সেকশন দেখতে পাবেন। সেখান থেকে লম্বা কোডটি কপি করে নিন।
                                </p>
                                <div className="bg-slate-900 border border-amber-500/20 p-3 rounded-lg flex items-center gap-3">
                                    <Copy className="w-5 h-5 text-amber-500/50" />
                                    <span className="font-mono text-amber-200/80 text-xs">ee7XXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionHeader>

                <SectionHeader title="৩. cPanel এ Node.js Setup আপডেট">
                    <div className="space-y-4 text-sm">
                        <p>কপি করা API Key টি আপনার cPanel-এর অ্যাপ্লিকেশনে যুক্ত করতে হবে।</p>
                        <ol className="list-decimal list-inside space-y-3 text-slate-400 ml-2">
                            <li>আপনার cPanel-এর <strong>"Setup Node.js App"</strong> প্যানেলে যান।</li>
                            <li>আপনার রানিং অ্যাপটির পাশে <strong>Edit (Pencil Icon)</strong> এ ক্লিক করুন।</li>
                            <li>নিচের দিকে স্ক্রল করে <strong>"Environment variables"</strong> সেকশনে যান।</li>
                            <li><strong>Add Variable</strong> এ ক্লিক করুন এবং নিচের তথ্যগুলো দিন:
                                <div className="mt-3 ml-6 mb-3">
                                    <table className="w-full max-w-md border-collapse border border-amber-500/20 rounded-lg overflow-hidden">
                                        <thead>
                                            <tr className="bg-slate-800">
                                                <th className="border border-amber-500/20 px-4 py-2 text-left text-amber-300">Name</th>
                                                <th className="border border-amber-500/20 px-4 py-2 text-left text-amber-300">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-slate-900">
                                                <td className="border border-amber-500/20 px-4 py-2 font-mono text-xs text-amber-100">BROWSERLESS_API_KEY</td>
                                                <td className="border border-amber-500/20 px-4 py-2 text-xs text-slate-400">আপনার কপি করা API Key পেস্ট করুন</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </li>
                            <li>আগে যদি <code>CHROME_BIN</code> নামের কোনো ভ্যারিয়েবল তৈরি করে থাকেন, তবে সেটি <strong>Delete</strong> করে দিন।</li>
                            <li><strong>Save</strong> বাটনে ক্লিক করুন।</li>
                            <li>একদম উপরে গিয়ে অ্যাপটিকে একবার <strong>RESTART</strong> দিন।</li>
                        </ol>

                        <ImportantNote>
                            <strong>গুরুত্বপূর্ণ:</strong> Environment variable এড করার পর অ্যাপটি রিস্টার্ট না দিলে নতুন সেটিংস কাজ করবে না।
                        </ImportantNote>
                    </div>
                </SectionHeader>

                <SectionHeader title="৪. 429 Too Many Requests Error আসলে কী করবেন?">
                    <div className="space-y-4 text-sm">
                        <p className="text-slate-400">
                            Browserless.io এর ফ্রি টায়ারে একসাথে ২ টির বেশি ব্রাউজার সেশন ওপেন রাখা যায় না। আপনি যদি বারবার "Connect WhatsApp" বা "Retry" বাটনে ক্লিক করেন তবে এই এররটি আসতে পারে।
                        </p>
                        <SuccessBox>
                            <strong>কীভাবে ফিক্স করবেন:</strong> <br />
                            ১. ৩-৫ মিনিট অপেক্ষা করুন। <br />
                            ২. পেজটি হার্ড রিলোড দিন (Ctrl + Shift + R)। <br />
                            ৩. এরপর মাত্র <strong>একবার</strong> "Connect" বাটনে ক্লিক করে কিউআর কোড আসার জন্য অপেক্ষা করুন।
                        </SuccessBox>
                    </div>
                </SectionHeader>

            </GamePanel>
        </div>
    );
}
