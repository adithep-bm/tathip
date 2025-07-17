import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import SideBar from "../components/SideBar";

function CaseDetailPage() {
  const { case_id } = useParams();
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          < SideBar />
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-6">

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CaseDetailPage;