import SideBar from '../components/SideBar';
import Header from '../components/Header';

function CaseManagementPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          < SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3">

          </div>
        </div>
      </div>
    </div >
  );
}

export default CaseManagementPage;