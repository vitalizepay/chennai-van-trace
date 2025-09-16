import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Monitor, Database, CreditCard } from "lucide-react";
import SuperAdminAuth from "@/components/auth/SuperAdminAuth";

const AdminPortal = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">VitalizePay Admin Portal</h1>
          </div>
          <p className="text-slate-300 text-lg">Secure Administrative Access</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
            <Database className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-slate-300 text-sm">Multi-School Data</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
            <CreditCard className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-slate-300 text-sm">Billing Management</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-4 text-center">
            <Monitor className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <p className="text-slate-300 text-sm">Usage Analytics</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-slate-700 bg-slate-800/95 backdrop-blur">
          <CardHeader className="text-center space-y-3">
            <Badge variant="secondary" className="text-xs bg-red-900/30 text-red-300 border-red-700 mx-auto">
              <Shield className="h-3 w-3 mr-1" />
              Super Administrator Access
            </Badge>
            <CardTitle className="text-xl font-bold text-white">Secure Login Required</CardTitle>
            <p className="text-sm text-slate-400">
              Mobile Number + Password + TOTP Authentication
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <SuperAdminAuth onSuccess={handleAuthSuccess} />
            
            <div className="pt-4 border-t border-slate-700">
              <Button 
                variant="ghost" 
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={() => navigate('/auth')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Mobile App
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            This portal is for authorized administrators only. All access is logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;