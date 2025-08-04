
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

export async function GET() {
  try {
    const supabase = createClient();
  
    const { data: completeGuides, error: guidesError } = await supabase
      .from('guides')
      .select('id, specialties, languages')
      .not('summary', 'is', null)
      .neq('summary', '')
      .not('specialties', 'is', null)
      .neq('specialties', '{}')
      .not('languages', 'is', null)
      .neq('languages', '{}')
      .gt('rate', 0);
    
    if (guidesError) {
        console.error('Error fetching guides for stats:', guidesError);
        return NextResponse.json({ error: 'Failed to fetch guide data' }, { status: 500 });
    }
  
    const guideCount = completeGuides?.length ?? 0;
  
    let specialtyCombinationCount = 0;
    const allLanguages = new Set<string>();

    if (completeGuides) {
        for (const guide of completeGuides) {
            const numSpecialties = guide.specialties?.length ?? 0;
            specialtyCombinationCount += factorial(numSpecialties);

            if (guide.languages) {
                for (const language of guide.languages) {
                    allLanguages.add(language);
                }
            }
        }
    }

    const languageCount = allLanguages.size;

    const stats = {
        guias: guideCount,
        especialidades: specialtyCombinationCount,
        idiomas: languageCount
    };

    return NextResponse.json(stats);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('API Stats Error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
