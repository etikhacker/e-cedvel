import React from 'react';

export function GradeCalculator({ onSave, initialSubject, existingDetails }: { onSave: (s:string,d:any)=>void; initialSubject?: string; existingDetails?: any }) {
	return (
		<div className="p-4 bg-background rounded">
			<div className="text-muted-foreground">Ballar kalkulyatoru (sadələşdirilmiş)</div>
			<button onClick={() => onSave(initialSubject || 'Mövzu', { total: existingDetails?.total ?? 0 })} className="mt-2 btn">Saxla</button>
		</div>
	);
}

export default GradeCalculator;