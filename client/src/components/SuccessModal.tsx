import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SuccessModalProps {
  credentials?: {
    email: string;
    password: string;
    recoveryEmail: string;
  };
  accounts?: Array<{
    transactionId: string;
    email: string;
    password: string;
    recoveryEmail: string;
  }>;
  transactionId?: string;
  quantity?: number;
  totalAmount?: number;
  onClose: () => void;
  onVerify: (transactionId: string) => void;
}

export function SuccessModal({ credentials, accounts, transactionId, quantity = 1, totalAmount, onClose, onVerify }: SuccessModalProps) {
  const { toast } = useToast();
  const isMultiple = quantity > 1;
  const accountsList = accounts || (credentials ? [{ transactionId: transactionId!, ...credentials }] : []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const copyAllCredentials = () => {
    const allCredentials = accountsList.map((account, index) => 
      `Account ${index + 1}:\nEmail: ${account.email}\nPassword: ${account.password}${account.recoveryEmail ? `\nRecovery: ${account.recoveryEmail}` : ''}\n`
    ).join('\n');
    
    copyToClipboard(allCredentials, 'All credentials');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent data-testid="modal-success">
        <DialogHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <DialogTitle>Purchase Successful!</DialogTitle>
          <DialogDescription>
            Your {isMultiple ? `${quantity} Gmail accounts are` : 'Gmail account is'} ready to use
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium">
              {isMultiple ? `${quantity} Account Credentials:` : 'Account Credentials:'}
            </div>
            {isMultiple && (
              <Button
                size="sm"
                variant="outline"
                onClick={copyAllCredentials}
                data-testid="button-copy-all"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy All
              </Button>
            )}
          </div>
          
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {accountsList.map((account, index) => (
              <div key={account.transactionId} className="bg-card p-3 rounded border space-y-2" data-testid={`account-${index}`}>
                {isMultiple && (
                  <div className="text-xs font-medium text-muted-foreground mb-2">Account {index + 1}</div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm" data-testid={`text-credential-email-${index}`}>{account.email}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(account.email, 'Email')}
                      data-testid={`button-copy-email-${index}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Password:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm" data-testid={`text-credential-password-${index}`}>{account.password}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(account.password, 'Password')}
                      data-testid={`button-copy-password-${index}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {account.recoveryEmail && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recovery Email:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm" data-testid={`text-credential-recovery-${index}`}>{account.recoveryEmail}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(account.recoveryEmail!, 'Recovery Email')}
                        data-testid={`button-copy-recovery-${index}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {totalAmount && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-green-800 dark:text-green-200">
              Total Purchase: ${totalAmount.toFixed(2)}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <p>✓ Please save these credentials securely</p>
          <p>✓ Test {isMultiple ? 'each account' : 'the account'} within 24 hours</p>
          <p>✓ Report issues immediately for fastest resolution</p>
        </div>
        
        <div className="flex space-x-3">
          {!isMultiple && transactionId && (
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => onVerify(transactionId)}
              data-testid="button-verify-account"
            >
              Verify Account
            </Button>
          )}
          <Button 
            className={isMultiple ? "w-full" : "flex-1"}
            onClick={onClose}
            data-testid="button-done"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
