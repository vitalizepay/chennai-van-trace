import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Eye, Lock, Users, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Information We Collect",
      icon: <Eye className="h-5 w-5" />,
      content: [
        {
          subtitle: "Personal Information",
          items: [
            "Students: Name, class/section, roll number, parent/guardian details",
            "Parents/Guardians: Name, email, mobile number, relationship to student",
            "Drivers: Name, license details, contact information, employment verification",
            "Addresses: Home address, pickup/drop-off locations (for route planning only)",
            "Emergency Contacts: Names and phone numbers"
          ]
        },
        {
          subtitle: "Location and Tracking Data",
          items: [
            "Real-time GPS location of vans during active trips",
            "Route details (stops, distance, timing)",
            "Geofence data for pickup/drop-off zones",
            "Historical location data (kept up to 30 days)"
          ]
        },
        {
          subtitle: "Usage and Technical Data",
          items: [
            "Login and app usage logs",
            "Device information (model, OS, version)",
            "Network information (IP address)",
            "Attendance records (boarding and drop-off status)"
          ]
        }
      ]
    },
    {
      title: "How We Use Information",
      icon: <Users className="h-5 w-5" />,
      content: [
        {
          subtitle: "Service Features",
          items: [
            "To provide live tracking of vans for parents and schools",
            "To send alerts and notifications (arrival, delays, SOS)",
            "To maintain attendance records",
            "To improve safety and route efficiency",
            "To provide technical support and resolve issues",
            "To comply with school safety regulations"
          ]
        }
      ]
    },
    {
      title: "Data Sharing",
      icon: <Users className="h-5 w-5" />,
      content: [
        {
          subtitle: "We share information only when required",
          items: [
            "With parents/guardians – about their own child only",
            "With school administrators – for safety and attendance",
            "With emergency services – during SOS or incidents",
            "With authorities – when legally required",
            "We never sell personal data or use it for advertising"
          ]
        }
      ]
    },
    {
      title: "Data Security",
      icon: <Lock className="h-5 w-5" />,
      content: [
        {
          subtitle: "We use strong safeguards to protect data",
          items: [
            "Encrypted data transfer (TLS)",
            "Secure cloud storage (Google Cloud/Firebase)",
            "Role-based access control",
            "Regular audits and monitoring"
          ]
        }
      ]
    },
    {
      title: "Data Retention and Deletion",
      icon: <Shield className="h-5 w-5" />,
      content: [
        {
          subtitle: "Retention Periods",
          items: [
            "Location data: kept up to 30 days",
            "Attendance records: kept for the current academic year + 1 year",
            "User accounts: deleted after graduation, transfer, or request",
            "Communication logs: kept up to 90 days",
            "Parents may request data deletion through the app or by contacting us. Requests are processed within 30 days."
          ]
        }
      ]
    },
    {
      title: "Children's Privacy",
      icon: <Shield className="h-5 w-5" />,
      content: [
        {
          subtitle: "Child Protection Measures",
          items: [
            "Parents/guardians must provide consent before a student's data is used",
            "Data collection is limited to what is needed for safety",
            "No advertising, profiling, or behavioral tracking of children"
          ]
        }
      ]
    },
    {
      title: "Your Rights",
      icon: <Shield className="h-5 w-5" />,
      content: [
        {
          subtitle: "You may",
          items: [
            "Access and review your personal data",
            "Correct or update inaccurate details",
            "Request account or data deletion",
            "Manage notification preferences",
            "Withdraw consent at any time (may limit app features)"
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">School Van Tracker</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Privacy Policy – School Van Tracker (Operated by VitalizePay)</CardTitle>
                  <p className="text-muted-foreground">Last updated: September 16, 2025</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The School Van Tracker app is operated by VitalizePay to ensure the safety and security of students 
                during their commute to and from schools in Tamil Nadu.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Important:</strong> This Privacy Policy explains how we collect, use, protect, and share personal information. 
                  By using the app, you agree to this Privacy Policy. If you do not agree, please stop using our services.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      {section.icon}
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.content.map((subsection, subIndex) => (
                    <div key={subIndex}>
                      <h4 className="font-semibold text-primary mb-3">{subsection.subtitle}</h4>
                      <ul className="space-y-2">
                        {subsection.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {subIndex < section.content.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact and Legal */}
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  For any privacy-related questions or concerns, please contact us:
                </p>
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>VitalizePay</strong>
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> senthil@vitalizeventures.in
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong> +91-9489721962
                  </p>
                  <p className="text-sm">
                    <strong>Address:</strong> VitalizePay, Saravanampatti,<br />
                    Coimbatore 641035 Tamil Nadu, India
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We may update this Privacy Policy from time to time. If there are significant changes, users will be notified 
                  via the app or email. Continued use after updates means acceptance of the revised policy.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/')} size="lg">
              Return to App
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;