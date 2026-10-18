'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReferenceDataTable } from './reference-data-table';
import { assetQueries } from '@/features/assets/api/queries';
import { 
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useCreateLocation, useUpdateLocation, useDeleteLocation,
  useCreateDepartment, useUpdateDepartment, useDeleteDepartment
} from '@/features/assets/api/mutations';
import { useQuery } from '@tanstack/react-query';

export function SettingsClient() {
  const { data: categories, isLoading: isCategoriesLoading } = useQuery(assetQueries.categories());
  const { data: locations, isLoading: isLocationsLoading } = useQuery(assetQueries.locations());
  const { data: departments, isLoading: isDepartmentsLoading } = useQuery(assetQueries.departments());

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const deleteDepartment = useDeleteDepartment();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>
      
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Manage asset categories. Categories are used to group related assets together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceDataTable 
                data={categories || []} 
                isLoading={isCategoriesLoading}
                title="Category"
                onCreate={(name) => createCategory.mutate(name)}
                onUpdate={(id, name) => updateCategory.mutate({ id, name })}
                onDelete={(id) => deleteCategory.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Locations</CardTitle>
              <CardDescription>
                Manage physical locations where assets can be assigned or stored.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceDataTable 
                data={locations || []} 
                isLoading={isLocationsLoading}
                title="Location"
                onCreate={(name) => createLocation.mutate(name)}
                onUpdate={(id, name) => updateLocation.mutate({ id, name })}
                onDelete={(id) => deleteLocation.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Manage departments within your organization for assigning assets and tracking costs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferenceDataTable 
                data={departments || []} 
                isLoading={isDepartmentsLoading}
                title="Department"
                onCreate={(name) => createDepartment.mutate(name)}
                onUpdate={(id, name) => updateDepartment.mutate({ id, name })}
                onDelete={(id) => deleteDepartment.mutate(id)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
