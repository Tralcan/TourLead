
"use client"

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export function StarRatingDisplay({ rating, reviews, className }: { rating: number, reviews?: number, className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(rating) ? "text-accent fill-accent" : "text-muted-foreground/30"
          )}
        />
      ))}
      {reviews !== undefined && <span className="text-sm text-muted-foreground ml-1">({reviews} reseñas)</span>}
    </div>
  );
}


export function RateEntity({ onSave, entityName, currentRating }: { onSave: (rating: number, comment: string) => void, entityName: string, currentRating?: number }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  if (currentRating) {
    return <StarRatingDisplay rating={currentRating} />;
  }

  const handleSave = () => {
    onSave(rating, comment);
    setOpen(false);
    toast({
        title: "Calificación Guardada",
        description: `Has calificado a ${entityName} con ${rating} estrellas.`,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">Calificar</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex flex-col items-center gap-4 p-4">
            <p className="font-medium">Calificar a {entityName}</p>
            <div className="flex">
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                return (
                    <Star
                        key={ratingValue}
                        className={cn(
                            "h-6 w-6 cursor-pointer transition-colors",
                             ratingValue <= (hover || rating) ? "text-accent fill-accent" : "text-muted-foreground/30"
                        )}
                        onClick={() => setRating(ratingValue)}
                        onMouseEnter={() => setHover(ratingValue)}
                        onMouseLeave={() => setHover(0)}
                    />
                );
            })}
            </div>
            <Textarea 
              placeholder="Añade un comentario (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 min-h-[80px]"
            />
            <Button onClick={handleSave} disabled={rating === 0} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Guardar Calificación
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
