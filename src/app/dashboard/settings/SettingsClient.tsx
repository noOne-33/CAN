
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Trash2, AlertTriangle, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function SettingsClient() {
  const [isPasswordConfirmOpen, setIsPasswordConfirmOpen] = useState(false);
  const [currentPasswordConfirm, setCurrentPasswordConfirm] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  const handleVerifyPassword = async () => {
    if (!currentPasswordConfirm) {
      toast({ title: 'Password Required', description: 'Please enter your current password.', variant: 'destructive' });
      return;
    }
    setIsVerifyingPassword(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      toast({ title: 'Authentication Error', description: 'Please log in again.', variant: 'destructive' });
      setIsVerifyingPassword(false);
      setIsPasswordConfirmOpen(false);
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: currentPasswordConfirm }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        toast({ title: 'Password Verified', description: 'You can now proceed to delete your account.' });
        setIsPasswordConfirmOpen(false);
        setCurrentPasswordConfirm(''); // Clear password field
        setIsDeleteDialogOpen(true); // Open final delete confirmation
      } else {
        toast({ title: 'Password Verification Failed', description: result.message || 'Incorrect password.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred during password verification.', variant: 'destructive' });
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const token = localStorage.getItem('authToken');
    // Token presence already checked implicitly by reaching this stage via password verification.
    // However, a direct call to this function might still warrant it if UI flow changes.

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (response.ok) {
        toast({ title: 'Account Deleted', description: 'Your account has been successfully deleted.' });
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        window.dispatchEvent(new Event('storage'));
        router.push('/'); 
      } else {
        toast({ title: 'Deletion Failed', description: result.message || 'Could not delete your account.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred while deleting the account.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false); // Close the final delete dialog
    }
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Settings size={24} className="mr-2 text-primary" />
            Account Settings
          </CardTitle>
          <CardDescription>Manage your account preferences and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-destructive">
                <AlertTriangle size={20} className="mr-2" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-destructive/90 mb-3">
                Deleting your account is a permanent action and cannot be undone.
                All your data, including order history and saved addresses, will be removed.
              </CardDescription>
              <Button
                variant="destructive"
                onClick={() => setIsPasswordConfirmOpen(true)} // Open password confirm dialog first
                disabled={isDeleting || isVerifyingPassword}
              >
                <Trash2 size={16} className="mr-2" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
           <div className="mt-6">
             <h3 className="text-lg font-semibold mb-2">Other Settings</h3>
             <p className="text-muted-foreground">
                More account settings like notification preferences, theme choices, etc., will be available here in the future.
             </p>
           </div>
        </CardContent>
      </Card>

      {/* Password Confirmation Dialog */}
      <Dialog open={isPasswordConfirmOpen} onOpenChange={(open) => { if (!isVerifyingPassword) setIsPasswordConfirmOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center"><KeyRound size={20} className="mr-2 text-primary"/>Confirm Your Password</DialogTitle>
            <DialogDescription>
              For security, please enter your current password to proceed with account deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="currentPasswordConfirm">Current Password</Label>
              <Input
                id="currentPasswordConfirm"
                type="password"
                value={currentPasswordConfirm}
                onChange={(e) => setCurrentPasswordConfirm(e.target.value)}
                placeholder="Enter your current password"
                disabled={isVerifyingPassword}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isVerifyingPassword}>Cancel</Button></DialogClose>
            <Button type="button" onClick={handleVerifyPassword} disabled={isVerifyingPassword || !currentPasswordConfirm}>
              {isVerifyingPassword ? <LoadingSpinner size={18} className="mr-2"/> : 'Confirm & Proceed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Delete Account Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action is permanent and cannot be undone. All your data, including profile information, order history, and saved addresses, will be permanently deleted.
              <br /><br />
              Please confirm that you wish to delete your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <LoadingSpinner size={18} className="mr-2" /> : 'Yes, Delete My Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
