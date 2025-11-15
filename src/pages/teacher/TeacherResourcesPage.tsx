import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, MoreVertical, FilePenLine, Trash2, Download, Search, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Resource } from '@shared/types';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ResourceForm } from '@/components/forms/ResourceForm';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
const fetchResources = async (search: string): Promise<Resource[]> => {
  return api<Resource[]>(`/api/resources?search=${search}`, { headers: { 'X-Mock-Role': 'teacher' } });
};
export default function TeacherResourcesPage() {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['teacher-resources', searchQuery],
    queryFn: () => fetchResources(searchQuery),
  });
  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-resources'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setDialogOpen(false);
      setEditingResource(null);
    },
    onError: (err: Error) => toast.error(err.message || 'An error occurred.'),
  };
  const createMutation = useMutation({
    mutationFn: (newResource: Omit<Resource, 'id' | 'tenantId' | 'creatorId' | 'downloads' | 'createdAt'>) =>
      api<Resource>('/api/resources', { method: 'POST', body: JSON.stringify(newResource) }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Resource created successfully!');
      mutationOptions.onSuccess();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (updatedResource: Partial<Resource> & { id: string }) =>
      api<Resource>(`/api/resources/${updatedResource.id}`, { method: 'PUT', body: JSON.stringify(updatedResource) }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Resource updated successfully!');
      mutationOptions.onSuccess();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (resourceId: string) => api(`/api/resources/${resourceId}`, { method: 'DELETE' }),
    ...mutationOptions,
    onSuccess: () => {
      toast.success('Resource deleted successfully!');
      mutationOptions.onSuccess();
    },
  });
  const handleFormSubmit = (values: any) => {
    if (editingResource) {
      updateMutation.mutate({ ...values, id: editingResource.id });
    } else {
      createMutation.mutate(values);
    }
  };
  const openCreateDialog = () => {
    setEditingResource(null);
    setDialogOpen(true);
  };
  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setDialogOpen(true);
  };
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Manage Resources</h1>
          <p className="mt-2 text-lg text-muted-foreground">Upload and manage learning materials.</p>
        </div>
        <Button className="gap-2" onClick={openCreateDialog}>
          <PlusCircle className="h-5 w-5" /> Add Resource
        </Button>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingResource(null); setDialogOpen(isOpen); }}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add a New Resource'}</DialogTitle>
            <DialogDescription>{editingResource ? 'Update the details for your resource.' : 'Fill in the details to add a new resource.'}</DialogDescription>
          </DialogHeader>
          <ResourceForm
            onSubmit={handleFormSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
            initialData={editingResource || undefined}
          />
        </DialogContent>
      </Dialog>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}
      {error && <p className="text-destructive">Failed to load resources.</p>}
      {!isLoading && !error && (
        resources?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="text-xl font-semibold mt-4">No resources found.</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              {searchQuery ? `No results for "${searchQuery}".` : "You haven't added any resources yet."}
            </p>
            <Button onClick={openCreateDialog}><PlusCircle className="mr-2 h-4 w-4" /> Add Your First Resource</Button>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-8" variants={containerVariants} initial="hidden" animate="visible">
            {resources?.map((resource) => (
              <motion.div key={resource.id} variants={itemVariants}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{resource.title}</CardTitle>
                        <CardDescription className="mt-1">{resource.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(resource)}><FilePenLine className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the resource.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate(resource.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Badge variant="secondary">{resource.category}</Badge>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Download className="mr-2 h-4 w-4" />
                      <span>{resource.downloads} downloads</span>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer">View Resource</a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )
      )}
    </div>
  );
}