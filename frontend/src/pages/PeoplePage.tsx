import { Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';

export function PeoplePage() {
    return (
        <Layout>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <h1 className="page-title mb-6">Team Members</h1>
                <div className="card flex flex-col items-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-pink-500 text-white shadow-md shadow-blue-500/20">
                        <Users className="h-7 w-7" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">Members live in Team Details</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">
                        Open the <span className="font-medium text-blue-600">Details</span> tab from the sidebar to view and manage everyone on this team.
                    </p>
                </div>
            </div>
        </Layout>
    );
}
