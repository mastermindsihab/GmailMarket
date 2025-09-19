import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  buyPrice: z.string().min(1, "Buy price is required"),
  sellPrice: z.string().min(1, "Sell price is required"),
  icon: z.string().min(1, "Icon is required"),
  iconColor: z.string().min(1, "Icon color is required"),
  isActive: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  buyPrice: string;
  sellPrice: string;
  icon: string;
  iconColor: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCategories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/admin/categories'],
  });

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      buyPrice: "",
      sellPrice: "",
      icon: "Package",
      iconColor: "blue",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const response = await apiRequest('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryForm }) => {
      const response = await apiRequest(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const populateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/populate-categories', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] });
      toast({
        title: "Success",
        description: "Gmail categories populated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to populate categories",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset(category);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6" data-testid="admin-categories">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Category Management</h1>
          <p className="text-muted-foreground">Manage Gmail account categories</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => populateMutation.mutate()}
            disabled={populateMutation.isPending}
            variant="outline"
            data-testid="button-populate-categories"
          >
            <Package className="h-4 w-4 mr-2" />
            Populate Gmail Categories
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAdd} data-testid="button-add-category">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update the category details" : "Create a new Gmail account category"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Business Gmail"
                    data-testid="input-category-name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    placeholder="business-gmail"
                    data-testid="input-category-slug"
                  />
                  {form.formState.errors.slug && (
                    <p className="text-sm text-red-500">{form.formState.errors.slug.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Professional Gmail accounts for business use"
                  data-testid="textarea-category-description"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buyPrice">Buy Price ($) - Paid to Sellers</Label>
                  <Input
                    id="buyPrice"
                    {...form.register("buyPrice")}
                    placeholder="8.99"
                    type="number"
                    step="0.01"
                    data-testid="input-category-buy-price"
                  />
                  {form.formState.errors.buyPrice && (
                    <p className="text-sm text-red-500">{form.formState.errors.buyPrice.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sellPrice">Sell Price ($) - Charged to Buyers</Label>
                  <Input
                    id="sellPrice"
                    {...form.register("sellPrice")}
                    placeholder="12.99"
                    type="number"
                    step="0.01"
                    data-testid="input-category-sell-price"
                  />
                  {form.formState.errors.sellPrice && (
                    <p className="text-sm text-red-500">{form.formState.errors.sellPrice.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    {...form.register("icon")}
                    placeholder="Package"
                    data-testid="input-category-icon"
                  />
                  {form.formState.errors.icon && (
                    <p className="text-sm text-red-500">{form.formState.errors.icon.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="iconColor">Icon Color</Label>
                  <Input
                    id="iconColor"
                    {...form.register("iconColor")}
                    placeholder="blue"
                    data-testid="input-category-icon-color"
                  />
                  {form.formState.errors.iconColor && (
                    <p className="text-sm text-red-500">{form.formState.errors.iconColor.message}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isActive"
                    checked={form.watch("isActive")}
                    onCheckedChange={(checked) => form.setValue("isActive", checked)}
                    data-testid="switch-category-active"
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-category"
                >
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Total categories: {categories?.length || 0}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Buy Price</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Profit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${category.iconColor}-100`}>
                          <Package className={`h-4 w-4 text-${category.iconColor}-600`} />
                        </div>
                        <div>
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${category.buyPrice}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">${category.sellPrice}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        ${(parseFloat(category.sellPrice || '0') - parseFloat(category.buyPrice || '0')).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          data-testid={`button-edit-category-${category.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(category.id)}
                          className="text-red-600"
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}