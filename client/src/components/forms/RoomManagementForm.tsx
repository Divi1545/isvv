import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Hotel, Bed, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { bedTypes, amenityOptions, type BedType, type AmenityOption } from "@shared/schema";

const roomTypeSchema = z.object({
  roomTypeName: z.string().min(1, "Room type name is required"),
  bedTypes: z.array(z.string()).min(1, "At least one bed type is required"),
  numberOfRooms: z.number().min(1, "Must have at least 1 room"),
  amenities: z.array(z.string()),
  description: z.string().optional(),
  priceModifier: z.number().min(0.1).max(10).default(1.0),
});

const roomManagementSchema = z.object({
  roomTypes: z.array(roomTypeSchema),
});

type RoomManagementFormData = z.infer<typeof roomManagementSchema>;

interface RoomManagementFormProps {
  vendorId?: number;
  initialData?: any[];
  onSave: (data: RoomManagementFormData) => void;
  onCancel: () => void;
}

// Helper function to format bed type names
const formatBedType = (bedType: string): string => {
  return bedType.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper function to format amenity names
const formatAmenity = (amenity: string): string => {
  return amenity.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function RoomManagementForm({ 
  vendorId, 
  initialData = [], 
  onSave, 
  onCancel 
}: RoomManagementFormProps) {
  const form = useForm<RoomManagementFormData>({
    resolver: zodResolver(roomManagementSchema),
    defaultValues: {
      roomTypes: initialData.length > 0 ? initialData : [{
        roomTypeName: "",
        bedTypes: [],
        numberOfRooms: 1,
        amenities: [],
        description: "",
        priceModifier: 1.0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomTypes",
  });

  const addRoomType = () => {
    append({
      roomTypeName: "",
      bedTypes: [],
      numberOfRooms: 1,
      amenities: [],
      description: "",
      priceModifier: 1.0,
    });
  };

  const handleBedTypeChange = (roomIndex: number, bedType: string, checked: boolean) => {
    const currentBedTypes = form.getValues(`roomTypes.${roomIndex}.bedTypes`);
    if (checked) {
      form.setValue(`roomTypes.${roomIndex}.bedTypes`, [...currentBedTypes, bedType]);
    } else {
      form.setValue(`roomTypes.${roomIndex}.bedTypes`, currentBedTypes.filter(bt => bt !== bedType));
    }
  };

  const handleAmenityChange = (roomIndex: number, amenity: string, checked: boolean) => {
    const currentAmenities = form.getValues(`roomTypes.${roomIndex}.amenities`);
    if (checked) {
      form.setValue(`roomTypes.${roomIndex}.amenities`, [...currentAmenities, amenity]);
    } else {
      form.setValue(`roomTypes.${roomIndex}.amenities`, currentAmenities.filter(a => a !== amenity));
    }
  };

  const onSubmit = (data: RoomManagementFormData) => {
    onSave(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Hotel className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Room Types & Amenities</h2>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addRoomType}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Room Type
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {fields.map((field, roomIndex) => (
          <Card key={field.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bed className="h-4 w-4" />
                  Room Type {roomIndex + 1}
                </CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(roomIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Room Type Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`roomTypes.${roomIndex}.roomTypeName`}>
                    Room Type Name *
                  </Label>
                  <Input
                    {...form.register(`roomTypes.${roomIndex}.roomTypeName`)}
                    placeholder="e.g., Deluxe Double, Family Suite"
                    className="mt-1"
                  />
                  {form.formState.errors.roomTypes?.[roomIndex]?.roomTypeName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.roomTypes[roomIndex]?.roomTypeName?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`roomTypes.${roomIndex}.numberOfRooms`}>
                    Number of Rooms *
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    {...form.register(`roomTypes.${roomIndex}.numberOfRooms`, { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {form.formState.errors.roomTypes?.[roomIndex]?.numberOfRooms && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.roomTypes[roomIndex]?.numberOfRooms?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Price Modifier */}
              <div>
                <Label htmlFor={`roomTypes.${roomIndex}.priceModifier`}>
                  Price Modifier (1.0 = base price)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  {...form.register(`roomTypes.${roomIndex}.priceModifier`, { valueAsNumber: true })}
                  className="mt-1 max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Multiplier for base service price (e.g., 1.5 = 50% more expensive)
                </p>
              </div>

              <Separator />

              {/* Bed Types */}
              <div>
                <Label className="text-base font-medium">Bed Types *</Label>
                <p className="text-sm text-gray-500 mb-3">Select all bed types available in this room</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {bedTypes.map((bedType) => (
                    <div key={bedType} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bed-${roomIndex}-${bedType}`}
                        checked={form.watch(`roomTypes.${roomIndex}.bedTypes`)?.includes(bedType) || false}
                        onCheckedChange={(checked) => 
                          handleBedTypeChange(roomIndex, bedType, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`bed-${roomIndex}-${bedType}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {formatBedType(bedType)}
                      </Label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.roomTypes?.[roomIndex]?.bedTypes && (
                  <p className="text-sm text-red-600 mt-2">
                    {form.formState.errors.roomTypes[roomIndex]?.bedTypes?.message}
                  </p>
                )}
              </div>

              <Separator />

              {/* Amenities */}
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Amenities
                </Label>
                <p className="text-sm text-gray-500 mb-3">Select all amenities available</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenityOptions.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${roomIndex}-${amenity}`}
                        checked={form.watch(`roomTypes.${roomIndex}.amenities`)?.includes(amenity) || false}
                        onCheckedChange={(checked) => 
                          handleAmenityChange(roomIndex, amenity, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`amenity-${roomIndex}-${amenity}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {formatAmenity(amenity)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <Label htmlFor={`roomTypes.${roomIndex}.description`}>
                  Room Description
                </Label>
                <Textarea
                  {...form.register(`roomTypes.${roomIndex}.description`)}
                  placeholder="Describe the room features, views, special characteristics..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Selected Items Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Preview:</h4>
                <div className="flex flex-wrap gap-2">
                  {form.watch(`roomTypes.${roomIndex}.bedTypes`)?.map((bedType) => (
                    <Badge key={bedType} variant="secondary">
                      {formatBedType(bedType)}
                    </Badge>
                  ))}
                  {form.watch(`roomTypes.${roomIndex}.amenities`)?.map((amenity) => (
                    <Badge key={amenity} variant="outline">
                      {formatAmenity(amenity)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Saving..." : "Save Room Types"}
          </Button>
        </div>
      </form>
    </div>
  );
}