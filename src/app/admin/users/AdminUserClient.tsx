
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { User } from '@/types'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Users as UsersIcon, RefreshCw, Save, X, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ClientSideFormattedDate from '@/components/shared/ClientSideFormattedDate'; // Import the new component
import { Label } from '@/components/ui/label';

interface AdminUserClientProps {
  initialUsers: User[]; // Expect createdAt to be string | undefined
}

// Ensure UserWithDate expects createdAt as string | undefined to match server prop
type UserWithDate = Omit<User, 'createdAt'> & { createdAt?: string };


export default function AdminUserClient({ initialUsers }: AdminUserClientProps) {
  const [users, setUsers] = useState<UserWithDate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithDate | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [userToEditRole, setUserToEditRole] = useState<UserWithDate | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<'user' | 'admin'>('user');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [loggedInAdminId, setLoggedInAdminId] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
     // Keep createdAt as a string, as passed from the server to avoid hydration issues.
     // The ClientSideFormattedDate component will handle parsing and formatting.
     setUsers(initialUsers.map(u => ({
        ...u, 
        id: u._id?.toString() || u.id,
        // createdAt: u.createdAt (it's already a string or undefined from initialUsers)
    })));
    const adminId = localStorage.getItem('userId');
    setLoggedInAdminId(adminId);
  }, [initialUsers]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data: User[] = await response.json(); // API returns User[] where createdAt is string | undefined
      setUsers(data.map(u => ({
        ...u, 
        id: u._id?.toString() || u.id,
        // createdAt remains string | undefined
      })));
      toast({ title: "Users Refreshed", description: "The list of users has been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleEditRoleClick = (user: UserWithDate) => {
    setUserToEditRole(user);
    setEditingUserRole(user.role);
    setIsEditRoleModalOpen(true);
  };

  const handleUpdateUserRole = async () => {
    if (!userToEditRole || !userToEditRole.id || userToEditRole.role === editingUserRole) {
      setIsEditRoleModalOpen(false);
      if(userToEditRole && userToEditRole.role === editingUserRole) {
        toast({ title: "No Change", description: "User role is already set to the selected value." });
      }
      return;
    }
    setIsUpdatingRole(true);
    try {
      const response = await fetch(`/api/admin/users/${userToEditRole.id.toString()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editingUserRole }),
      });
      const result = await response.json(); // API returns User where createdAt is string | undefined
      if (response.ok) {
        toast({ title: "User Role Updated", description: `Role for ${result.name || result.email} updated to ${result.role}.` });
        setUsers(prev => prev.map(u => u.id === result.id ? { ...u, ...result, id: result._id?.toString() || result.id } : u));
        setIsEditRoleModalOpen(false);
      } else {
        toast({ title: "Error Updating Role", description: result.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to update user role.", variant: "destructive" });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteClick = (user: UserWithDate) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !userToDelete.id) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id.toString()}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
        toast({ title: "User Deleted", description: `User "${userToDelete.name || userToDelete.email}" has been successfully deleted.` });
      } else {
        const errorData = await response.json();
        toast({ title: "Error Deleting User", description: errorData.message || "An unexpected error occurred.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Failed to delete user.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      setIsDeleting(false);
    }
  };
  
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = user.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch;
    });
  }, [users, searchTerm]);


  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-2xl font-semibold flex items-center">
          <UsersIcon size={26} className="mr-2 text-primary" /> Manage Users
        </h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading || isDeleting || isUpdatingRole}>
          <RefreshCw size={16} className="mr-2" /> Refresh Users
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full md:w-1/2 lg:w-1/3"
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading && users.length === 0 ? (
        <div className="text-center py-12">
          <LoadingSpinner text="Loading users..." />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id?.toString()}>
                  <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-primary/20 text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? <ClientSideFormattedDate isoDateString={user.createdAt} /> : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting || isUpdatingRole}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRoleClick(user)} disabled={isDeleting || isUpdatingRole || user.id === loggedInAdminId}>
                          <Edit size={16} className="mr-2" /> Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(user)} 
                          className="text-destructive" 
                          disabled={isDeleting || isUpdatingRole || user.id === loggedInAdminId}
                        >
                          <Trash2 size={16} className="mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          {searchTerm ? 'No users match your search.' : 'No users found. System might be empty or an error occurred.'}
        </p>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user
              &quot;{userToDelete?.name || userToDelete?.email}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting ? <LoadingSpinner size={18} className="mr-2"/> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditRoleModalOpen} onOpenChange={(open) => {
        if (isUpdatingRole) return;
        setIsEditRoleModalOpen(open);
        if (!open) setUserToEditRole(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {userToEditRole?.name || userToEditRole?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right col-span-1">Role</Label>
              <Select value={editingUserRole} onValueChange={(value: 'user' | 'admin') => setEditingUserRole(value)} disabled={isUpdatingRole}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isUpdatingRole}><X size={16} className="mr-2" /> Cancel</Button></DialogClose>
            <Button type="button" onClick={handleUpdateUserRole} disabled={isUpdatingRole || userToEditRole?.role === editingUserRole}>
              {isUpdatingRole ? <LoadingSpinner size={18} className="mr-2"/> : <Save size={16} className="mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
