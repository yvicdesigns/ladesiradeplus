import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const SurveyModal = ({ open, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'general', status: 'draft',
    start_date: new Date().toISOString().split('T')[0], end_date: ''
  });
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', question_type: 'text', is_required: false, options: [] }]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const newQs = [...questions];
    newQs[idx] = { ...newQs[idx], [field]: value };
    setQuestions(newQs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData, questions);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Créer un sondage</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Titre du sondage</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={val => setFormData({...formData, type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="nps">NPS</SelectItem>
                    <SelectItem value="satisfaction">Satisfaction</SelectItem>
                    <SelectItem value="product_feedback">Produit</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Date fin (Optionnel)</Label>
                <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
             </div>
          </div>

          <div className="space-y-2">
             <Label>Description</Label>
             <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="border-t pt-4 mt-4">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-semibold text-sm">Questions</h4>
               <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                 <Plus className="w-3 h-3 mr-2"/> Ajouter Question
               </Button>
             </div>
             
             <div className="space-y-3">
               {questions.map((q, idx) => (
                 <Card key={idx} className="p-3 relative bg-muted/20">
                    <Button type="button" size="icon" variant="ghost" className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-red-500" onClick={() => removeQuestion(idx)}>
                      <Trash2 className="w-3 h-3"/>
                    </Button>
                    <div className="grid gap-3">
                       <Input 
                         placeholder="Votre question..." 
                         value={q.question_text} 
                         onChange={e => updateQuestion(idx, 'question_text', e.target.value)} 
                         className="bg-white"
                         required
                       />
                       <div className="flex gap-4">
                         <Select value={q.question_type} onValueChange={val => updateQuestion(idx, 'question_type', val)}>
                           <SelectTrigger className="w-[180px] h-8 bg-white"><SelectValue /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="text">Texte libre</SelectItem>
                             <SelectItem value="rating">Note (1-5)</SelectItem>
                             <SelectItem value="yes_no">Oui/Non</SelectItem>
                             <SelectItem value="multiple_choice">Choix multiple</SelectItem>
                           </SelectContent>
                         </Select>
                         {/* Option handling for multiple choice would go here */}
                       </div>
                    </div>
                 </Card>
               ))}
               {questions.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Aucune question ajoutée</p>}
             </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};