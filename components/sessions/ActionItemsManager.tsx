'use client';

import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ActionItem {
  item: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface ActionItemsManagerProps {
  label: string;
  items: ActionItem[];
  onChange: (items: ActionItem[]) => void;
}

export function ActionItemsManager({ label, items, onChange }: ActionItemsManagerProps) {
  const [newItem, setNewItem] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      onChange([
        ...items,
        {
          item: newItem,
          dueDate: newDueDate,
          status: 'pending'
        }
      ]);
      setNewItem('');
      setNewDueDate('');
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <div className="space-y-2">
        {items.map((item, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium">{item.item}</p>
                {item.dueDate && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(item.dueDate).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Añadir acción..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
              }
            }}
          />
        </div>
        <Input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="w-40"
        />
        <Button type="button" onClick={addItem} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
