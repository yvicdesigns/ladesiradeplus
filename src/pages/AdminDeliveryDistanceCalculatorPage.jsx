import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QUARTERS } from '@/lib/BrazzavilleQuarters';
import { DeliveryDistanceService } from '@/lib/DeliveryDistanceService';
import { calculateDeliveryFeeByDistance } from '@/lib/deliveryCalculations';
import { formatCurrency } from '@/lib/formatters';
import { Search, ArrowUpDown, MapPin, Calculator, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const AdminDeliveryDistanceCalculatorPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Calculate data for all quarters
  const quartersData = useMemo(() => {
    return QUARTERS.map(quarter => {
      const distance = DeliveryDistanceService.getDistanceFromNkombo(quarter.coordinates);
      const { fee, tier } = calculateDeliveryFeeByDistance(distance);
      
      // Calculate diff from old fixed fee if needed, or just display
      const fixedFee = quarter.fee; // The old static fee from the array

      return {
        ...quarter,
        calculatedDistance: parseFloat(distance.toFixed(2)),
        calculatedFee: fee,
        tier,
        fixedFee
      };
    });
  }, []);

  // Filter and Sort
  const filteredData = useMemo(() => {
    let data = [...quartersData];

    if (searchTerm) {
      data = data.filter(q => 
        q.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return data;
  }, [quartersData, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData.map(q => ({
      'Quartier': q.name,
      'Distance (km)': q.calculatedDistance,
      'Zone': q.tier,
      'Frais Calculé (CFA)': q.calculatedFee,
      'Ancien Frais Fixe (CFA)': q.fixedFee
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Frais Livraison");
    XLSX.writeFile(wb, "Calculateur_Frais_Livraison.xlsx");
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case '0-10km': return 'bg-amber-100 text-amber-800 border-amber-200';
      case '10-20km': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '20km+': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calculateur de Frais de Livraison</h1>
            <p className="text-muted-foreground mt-1">
              Basé sur la distance réelle depuis NKOMBO (Coordonnées: {DeliveryDistanceService.appendBrazzavilleCongo('')} Lat: -4.206, Lon: 15.243)
            </p>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Zone 1 (0-10km)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">1 000 FCFA</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Zone 2 (10-20km)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">2 000 FCFA</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Zone 3 (20km+)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">3 000 FCFA</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Liste des Quartiers
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un quartier..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <CardDescription>
              {filteredData.length} quartiers trouvés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort('name')}>
                      <div className="flex items-center gap-2">
                        Quartier
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('calculatedDistance')}>
                      <div className="flex items-center gap-2">
                        Distance (km)
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('tier')}>
                       <div className="flex items-center gap-2">
                        Zone Tarifaire
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => requestSort('calculatedFee')}>
                       <div className="flex items-center justify-end gap-2">
                        Frais Calculé
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((quarter) => (
                    <TableRow key={quarter.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {quarter.name}
                        </div>
                      </TableCell>
                      <TableCell>{quarter.calculatedDistance} km</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getTierColor(quarter.tier)}>
                          {quarter.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(quarter.calculatedFee)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucun quartier trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDeliveryDistanceCalculatorPage;