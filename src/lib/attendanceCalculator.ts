export const cleanNumber = (val: any) => Math.abs(parseInt(String(val).replace(/[^0-9]/g, ''), 10)) || 0;

export function calculateSubjectMetrics(theoryConducted: number, practicalConducted: number, theoryAttended: number, practicalAttended: number) {
  const conducted = theoryConducted + practicalConducted;
  const attended = theoryAttended + practicalAttended;
  const missed = Math.max(0, conducted - attended);
  const percentage = conducted > 0 ? Number(((attended / conducted) * 100).toFixed(2)) : 0;
  
  return { conducted, attended, missed, percentage };
}

export function calculateOverallMetrics(subjects: any[]) {
  const total_conducted = subjects.reduce((sum, s) => sum + (s.totalConducted !== undefined ? s.totalConducted : s.conducted || 0), 0);
  const total_attended = subjects.reduce((sum, s) => sum + (s.totalAttended !== undefined ? s.totalAttended : s.attended || 0), 0);
  const total_missed = Math.max(0, total_conducted - total_attended);
  const overall_percentage = total_conducted > 0 ? Number(((total_attended / total_conducted) * 100).toFixed(2)) : 0;
  
  return { total_conducted, total_attended, total_missed, overall_percentage };
}

export function calculateBufferMetrics(attended: number, conducted: number, targetFraction: number = 0.75) {
  if (conducted === 0) return { safe_bunks: 0, classes_needed: 0 };
  const percentage = (attended / conducted);
  
  if (percentage >= targetFraction) {
    const safe_bunks = Math.floor((attended - targetFraction * conducted) / targetFraction);
    return { safe_bunks: Math.max(0, safe_bunks), classes_needed: 0 };
  } else {
    const classes_needed = Math.ceil((targetFraction * conducted - attended) / (1 - targetFraction));
    return { safe_bunks: 0, classes_needed: Math.max(0, classes_needed) };
  }
}
