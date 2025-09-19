
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, DollarSign, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Terms & Conditions</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-6">
            {/* Account Purchase Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Account Purchase Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Buying Guidelines:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>All purchases are final once completed</li>
                    <li>Account credentials are delivered instantly after payment</li>
                    <li>You have 24 hours to verify and report any issues</li>
                    <li>Maximum 50 accounts per single purchase</li>
                    <li>Minimum age requirement: 13 years</li>
                    <li>Each account can only be purchased once</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Account Usage:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Accounts are for legitimate use only</li>
                    <li>No illegal activities or spam allowed</li>
                    <li>Respect Gmail's Terms of Service</li>
                    <li>Change passwords immediately after purchase</li>
                    <li>We are not responsible for account suspension due to misuse</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Selling Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-500" />
                  Selling Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Account Quality Requirements:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>All accounts must be functional and accessible</li>
                    <li>Provide accurate recovery email information</li>
                    <li>Accounts should not be associated with violations</li>
                    <li>Fresh accounts should have no previous usage</li>
                    <li>Aged accounts must have legitimate activity history</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Seller Responsibilities:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Provide working accounts only</li>
                    <li>Respond to disputes within 3 hours</li>
                    <li>Maintain account inventory accuracy</li>
                    <li>Accept responsibility for non-working accounts</li>
                    <li>Payment released only after buyer verification</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Balance Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-orange-500" />
                  Payment & Balance Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Deposit Rules:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Minimum deposit: $5.00</li>
                    <li>Maximum deposit: $1000.00 per request</li>
                    <li>Deposits processed within 1-24 hours</li>
                    <li>Provide valid transaction ID for mobile money</li>
                    <li>Match deposit phone number with transaction</li>
                    <li>Admin approval required for all deposits</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Withdrawal Rules:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Minimum withdrawal: $5.00</li>
                    <li>Maximum withdrawal: Your available balance</li>
                    <li>Processing time: 1-72 hours</li>
                    <li>Provide accurate payment details</li>
                    <li>Withdrawals processed to verified accounts only</li>
                    <li>Admin verification required</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Dispute & Refund Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                  Dispute & Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Valid Dispute Reasons:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Account credentials don't work</li>
                    <li>Account suspended immediately after purchase</li>
                    <li>Recovery email not accessible</li>
                    <li>Account doesn't match description</li>
                    <li>Missing account features (for Edu accounts)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Dispute Process:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Must be reported within 24 hours of purchase</li>
                    <li>Provide detailed description of the issue</li>
                    <li>Include screenshots if applicable</li>
                    <li>Seller has 3 hours to respond</li>
                    <li>Auto-refund if seller doesn't respond</li>
                    <li>Admin mediation for complex cases</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Refund Policy:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Full refund for valid disputes</li>
                    <li>Refunds credited to account balance</li>
                    <li>No cash refunds - store credit only</li>
                    <li>Refund processing: Instant after approval</li>
                    <li>No refund for accounts after 24 hours</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Platform Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2 text-purple-500" />
                  Platform Rules & Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Account Verification:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Buyers must verify purchases within 24 hours</li>
                    <li>Auto-verification after 24 hours of no dispute</li>
                    <li>Verification releases payment to seller</li>
                    <li>Cannot dispute after verification</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Prohibited Activities:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Selling fake or non-working accounts</li>
                    <li>Creating multiple accounts to circumvent rules</li>
                    <li>Using accounts for illegal activities</li>
                    <li>Attempting to contact sellers outside platform</li>
                    <li>Sharing login credentials with others</li>
                    <li>Reselling purchased accounts</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Account Security:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Keep your login credentials secure</li>
                    <li>Use strong, unique passwords</li>
                    <li>Don't share account access</li>
                    <li>Report suspicious activity immediately</li>
                    <li>Regular security updates recommended</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Support Hours:</strong> 24/7 for urgent issues</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                  <p><strong>Dispute Resolution:</strong> 1-3 business days</p>
                  <p><strong>Technical Issues:</strong> Report immediately through platform</p>
                </div>
              </CardContent>
            </Card>

            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                By using our platform, you agree to these terms and conditions. 
                We reserve the right to update these terms at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
