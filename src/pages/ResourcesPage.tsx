import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Search, FileText, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { Resource } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
const fetchResources = async (search: string, category: string): Promise<Resource[]> => {
  const params = new URLSearchParams({ search, category });
  return api<Resource[]>(`/api/resources?${params.toString()}`);
};
const categoryIcons = {
  Documents: FileText,
  Images: ImageIcon,
  Videos: Video,
  Links: LinkIcon,
};
export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const queryClient = useQueryClient();
  const { data: resources, isLoading, error } = useQuery({
    queryKey: ['resources', searchQuery, categoryFilter],
    queryFn: () => fetchResources(searchQuery, categoryFilter),
  });
  const downloadMutation = useMutation({
    mutationFn: (resourceId: string) => api<{ fileUrl: string }>(`/api/resources/${resourceId}/download`, { method: 'POST' }),
    onSuccess: (data, resourceId) => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      window.open(data.fileUrl, '_blank');
      toast.success('Resource download started!');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to download resource.'),
  });
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-display text-foreground">Resource Library</h1>
          <p className="mt-2 text-lg text-muted-foreground">Find and download learning materials for your courses.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              <SelectItem value="Documents">Documents</SelectItem>
              <SelectItem value="Images">Images</SelectItem>
              <SelectItem value="Videos">Videos</SelectItem>
              <SelectItem value="Links">Links</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        )}
        {error && <p className="text-destructive text-center">Failed to load resources.</p>}
        {!isLoading && !error && (
          resources?.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-semibold mt-4">No Resources Found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
              {resources?.map((resource) => {
                const Icon = categoryIcons[resource.category] || FileText;
                return (
                  <motion.div key={resource.id} variants={itemVariants}>
                    <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      {resource.category === 'Images' ? (
                        <img src={resource.fileUrl} alt={resource.title} className="w-full h-48 object-cover rounded-t-lg" />
                      ) : (
                        <div className="h-48 flex items-center justify-center bg-muted rounded-t-lg">
                          <Icon className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <Badge variant="outline">{resource.category}</Badge>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full gap-2" onClick={() => downloadMutation.mutate(resource.id)} disabled={downloadMutation.isPending}>
                          <Download className="h-4 w-4" />
                          Download ({resource.downloads})
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}