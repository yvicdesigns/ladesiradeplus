import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database } from 'lucide-react';

export function AdminDebugTab() {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
      <CardHeader className="text-center pb-2">
        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-2 opacity-50" />
        <CardTitle className="text-lg text-muted-foreground">Outil de diagnostic supprimé</CardTitle>
        <CardDescription>
          Les outils de diagnostic ont été nettoyés pour alléger l'application.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center pb-6 text-sm text-muted-foreground">
        Veuillez utiliser l'onglet "Audit de robustesse" dans le menu principal pour les analyses complètes.
      </CardContent>
    </Card>
  );
}