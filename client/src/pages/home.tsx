import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Sparkles, Clock, User, GraduationCap, LayersIcon, Timer, CheckCircle, ShieldX, Shield, Bolt, Headphones } from "lucide-react";

const categoryIcons = {
  fresh: Sparkles,
  aged: Clock,
  used: User,
  edu: GraduationCap,
  bulk: LayersIcon,
  temporary: Timer,
  pva: CheckCircle,
  "non-pva": ShieldX,
};

const categoryColors = {
  fresh: "text-green-500",
  aged: "text-orange-500", 
  used: "text-blue-500",
  edu: "text-purple-500",
  bulk: "text-violet-500",
  temporary: "text-gray-500",
  pva: "text-green-600",
  "non-pva": "text-red-500",
};

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Buy & Sell Gmail Accounts Securely
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-primary-foreground/90 max-w-3xl mx-auto">
            Instant delivery • Verified accounts • Secure transactions
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-md sm:max-w-none mx-auto">
            <Button 
              className="bg-white text-primary hover:bg-gray-100 w-full sm:w-auto"
              onClick={() => setLocation('/dashboard')}
              data-testid="button-browse-categories"
            >
              Browse Categories
            </Button>
            <Button 
              variant="outline" 
              className="border-white bg-transparent text-white hover:bg-white hover:text-red-500 font-semibold w-full sm:w-auto"
              onClick={() => setLocation('/sell')}
              data-testid="button-start-selling"
            >
              Start Selling
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 text-center">Popular Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
          {(categories || []).map((category: any) => {
            const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || User;
            const iconColor = categoryColors[category.slug as keyof typeof categoryColors] || "text-primary";
            
            return (
              <Card 
                key={category.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/category/${category.slug}`)}
                data-testid={`card-category-${category.slug}`}
              >
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <IconComponent className={`h-8 w-8 ${iconColor} mr-3`} />
                    <CardTitle>{category.name}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-primary" data-testid={`text-price-${category.slug}`}>
                      From ${category.sellPrice}
                    </span>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/category/${category.slug}`);
                      }}
                      data-testid={`button-view-${category.slug}`}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-muted py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-8 sm:mb-12">Why Choose GmailMarket?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center" data-testid="feature-secure">
              <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">Secure Transactions</h4>
              <p className="text-muted-foreground text-sm sm:text-base">All transactions are protected with escrow and dispute resolution</p>
            </div>
            <div className="text-center" data-testid="feature-instant">
              <Bolt className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">Instant Delivery</h4>
              <p className="text-muted-foreground text-sm sm:text-base">Get your Gmail credentials immediately after payment</p>
            </div>
            <div className="text-center sm:col-span-2 lg:col-span-1" data-testid="feature-support">
              <Headphones className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">24/7 Support</h4>
              <p className="text-muted-foreground text-sm sm:text-base">Round-the-clock customer support for all your needs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
