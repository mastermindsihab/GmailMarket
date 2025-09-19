import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Bolt, Headphones } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">GmailMarket</h1>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => window.location.href = '/login'}
                variant="outline"
                data-testid="button-login"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => window.location.href = '/signup'}
                data-testid="button-signup"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Buy & Sell Gmail Accounts Securely</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">Instant delivery • Verified accounts • Secure transactions</p>
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={() => window.location.href = '/signup'}
              className="bg-white text-primary hover:bg-gray-100"
              data-testid="button-browse-categories"
            >
              Browse Categories
            </Button>
            <Button 
              onClick={() => window.location.href = '/signup'}
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary"
              data-testid="button-start-selling"
            >
              Start Selling
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-12">Why Choose GmailMarket?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card data-testid="card-secure-transactions">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Secure Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All transactions are protected with escrow and dispute resolution
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card data-testid="card-instant-delivery">
              <CardHeader className="text-center">
                <Bolt className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Instant Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Get your Gmail credentials immediately after payment
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card data-testid="card-support">
              <CardHeader className="text-center">
                <Headphones className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Round-the-clock customer support for all your needs
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-background py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
          <p className="text-muted-foreground mb-8">Join thousands of users buying and selling Gmail accounts securely</p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/signup'}
            data-testid="button-get-started"
          >
            Get Started Now
          </Button>
        </div>
      </div>
    </div>
  );
}
