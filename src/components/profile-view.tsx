import React from 'react';

export function ProfileView({ profile, onUpdate, onEditGrade }: { profile: any; onUpdate: (p:any)=>void; onEditGrade: (s:string)=>void }) {
	return (
		<div className="p-4 bg-background rounded">
			<div className="font-bold">{profile?.name}</div>
			<div className="text-sm text-muted-foreground">Subqrup: {profile?.subgroup}</div>
		</div>
	);
}

export default ProfileView;