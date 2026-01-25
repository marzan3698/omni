import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Facebook,
  MessageSquare,
  Settings,
  Link as LinkIcon,
  Shield,
  Zap,
} from 'lucide-react';

export default function MessengerSetupGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl">📖 মেসেঞ্জার সংযোগ গাইড</CardTitle>
              <CardDescription>Facebook Messenger সরাসরি connect করার সম্পূর্ণ নির্দেশিকা</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Introduction */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" />
              পরিচিতি
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700">
                <strong>Direct Messenger Integration</strong> হল একটি সহজ ও দ্রুত পদ্ধতি যার মাধ্যমে আপনি আপনার
                Facebook Page-এর Messenger সরাসরি Omni CRM-এর সাথে connect করতে পারবেন।
              </p>
              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">সহজ Setup</p>
                    <p className="text-sm text-gray-600">OAuth দিয়ে এক ক্লিকে connect</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">দ্রুত Connection</p>
                    <p className="text-sm text-gray-600">কয়েক সেকেন্ডে setup সম্পন্ন</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">স্বয়ংক্রিয় Webhook</p>
                    <p className="text-sm text-gray-600">Webhook automatically configure হয়</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-800">Secure Authentication</p>
                    <p className="text-sm text-gray-600">Facebook OAuth security standard</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Flow Diagram */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Connection Flow (সংযোগ প্রক্রিয়া)
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">"Login with Facebook" বাটনে ক্লিক করুন</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Integrations page-এ Direct Messenger card-এ "Login with Facebook" বাটনে ক্লিক করুন
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-4 ml-4">
                  <div className="w-8"></div>
                  <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Facebook Login & Permissions</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Facebook login page-এ redirect হবে। আপনার Facebook account দিয়ে login করুন এবং
                      permissions grant করুন
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-4 ml-4">
                  <div className="w-8"></div>
                  <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Page Selection</p>
                    <p className="text-sm text-gray-600 mt-1">
                      আপনার Facebook Pages-এর list দেখাবে। যে Page connect করতে চান, সেটি select করুন
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-4 ml-4">
                  <div className="w-8"></div>
                  <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Automatic Setup</p>
                    <p className="text-sm text-gray-600 mt-1">
                      System automatically page access token নেবে, webhook subscribe করবে, এবং integration
                      create করবে
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-4 ml-4">
                  <div className="w-8"></div>
                  <div className="flex-1 border-l-2 border-dashed border-gray-300 h-8"></div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Connection Complete!</p>
                    <p className="text-sm text-gray-600 mt-1">
                      আপনার Page এখন Omni CRM-এর সাথে connected! Inbox-এ messages দেখতে পাবেন
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Prerequisites */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              প্রয়োজনীয়তা
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Facebook Account</p>
                  <p className="text-sm text-gray-600">একটি valid Facebook account</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Facebook Page</p>
                  <p className="text-sm text-gray-600">কমপক্ষে একটি Facebook Page (আপনার own বা manage করা)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">Page Admin Access</p>
                  <p className="text-sm text-gray-600">Page-এর admin বা editor permission থাকতে হবে</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">SuperAdmin Access</p>
                  <p className="text-sm text-gray-600">Omni CRM-এ SuperAdmin হিসেবে login থাকতে হবে</p>
                </div>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              সমস্যা সমাধান
            </h3>
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-2">❓ No pages found</p>
                <p className="text-sm text-gray-600">
                  <strong>সমাধান:</strong> আপনার Facebook account-এ কমপক্ষে একটি Page থাকতে হবে এবং আপনি
                  সেই Page-এর admin/editor হতে হবে। Facebook-এ আপনার Pages check করুন।
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-2">❓ OAuth error</p>
                <p className="text-sm text-gray-600">
                  <strong>সমাধান:</strong> Facebook App ID এবং App Secret properly configured আছে কিনা
                  check করুন। Server environment variables verify করুন।
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800 mb-2">❓ Page not receiving messages</p>
                <p className="text-sm text-gray-600">
                  <strong>সমাধান:</strong> Webhook properly configured আছে কিনা verify করুন। Facebook App
                  Dashboard-এ webhook settings check করুন।
                </p>
              </div>
            </div>
          </section>

          {/* Comparison */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Direct vs Chatwoot - কোনটি ব্যবহার করবেন?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Direct Messenger
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>সহজ ও দ্রুত setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>OAuth authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Facebook Messenger only</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>No external service needed</span>
                  </li>
                </ul>
              </div>
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chatwoot
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Multi-channel support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Advanced features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Requires Chatwoot account</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 mb-1">💡 গুরুত্বপূর্ণ নোট</p>
                <p className="text-sm text-yellow-700">
                  Direct Messenger এবং Chatwoot - দুটি option-ই একসাথে ব্যবহার করা যায়। আপনি আপনার
                  প্রয়োজন অনুযায়ী যেকোনো একটি বা দুটোই connect করতে পারেন।
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
