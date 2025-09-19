import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef } from "react";

export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead 
  } = useNotifications();

  const prevUnreadCountRef = useRef(0);

  // Play notification sound when new notifications arrive
  useEffect(() => {
    if (prevUnreadCountRef.current < unreadCount && unreadCount > 0) {
      // Create and play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDuR2OnFdicHJIPA7+OVOQYUYESX5f+8jR4FSjr1+8pJGww8kNn3cXrLdieIyzCGsJ+HaYGBeZO0sGMa/jyeG2lQoXR9aHOx3gg=');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback for browsers that don't allow auto-play
        console.log('Audio notification blocked by browser');
      });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '🛒';
      case 'account_sold':
        return '💰';
      case 'dispute_created':
        return '⚠️';
      case 'dispute_accepted':
        return '✅';
      case 'dispute_rejected':
        return '❌';
      case 'refund':
        return '💸';
      case 'deposit_approved':
        return '✅';
      case 'deposit_rejected':
        return '❌';
      default:
        return '📢';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span data-testid="text-notifications-title">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground" data-testid="text-loading">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground" data-testid="text-no-notifications">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-pointer ${
                  !notification.isRead ? 'bg-accent/50' : ''
                }`}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-start space-x-2 flex-1">
                    <span className="text-lg" data-testid={`notification-icon-${notification.id}`}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm" data-testid={`notification-title-${notification.id}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            disabled={isMarkingAsRead}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`notification-message-${notification.id}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`notification-time-${notification.id}`}>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            {notifications.length > 10 && (
              <DropdownMenuItem className="text-center text-muted-foreground">
                <span data-testid="text-more-notifications">
                  and {notifications.length - 10} more...
                </span>
              </DropdownMenuItem>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}