import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DeliveryForm = ({ formData, setFormData, errors }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
    >
      {/* Added text-center to the h2 for centering */}
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center gap-2 text-center">
        <MapPin className="text-[#D97706] h-4 w-4" />
        Détails de livraison
      </h2>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-gray-700 font-medium text-xs">Nom complet</Label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="fullName"
              name="fullName"
              placeholder="Jean Dupont"
              value={formData.fullName}
              onChange={handleChange}
              // Updated to rounded-xl for more prominent corners, ensuring consistency with the Input component
              className={`pl-9 h-9 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] transition-all rounded-xl ${errors.fullName ? 'border-red-500 bg-red-50' : ''}`}
            />
          </div>
          {errors.fullName && <p className="text-red-500 text-xs mt-0.5">{errors.fullName}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-gray-700 font-medium text-xs">Téléphone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              name="phone"
              placeholder="+243..."
              value={formData.phone}
              onChange={handleChange}
              // Updated to rounded-xl for more prominent corners, ensuring consistency with the Input component
              className={`pl-9 h-9 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] transition-all rounded-xl ${errors.phone ? 'border-red-500 bg-red-50' : ''}`}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-0.5">{errors.phone}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-gray-700 font-medium text-xs">Adresse de livraison</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="address"
              name="address"
              placeholder="Numéro, Avenue, Quartier..."
              value={formData.address}
              onChange={handleChange}
              // Updated to rounded-xl for more prominent corners, ensuring consistency with the Input component
              className={`pl-9 h-9 text-sm bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#D97706] focus:ring-[#D97706] transition-all rounded-xl ${errors.address ? 'border-red-500 bg-red-50' : ''}`}
            />
          </div>
          {errors.address && <p className="text-red-500 text-xs mt-0.5">{errors.address}</p>}
        </div>
      </div>
    </motion.div>
  );
};