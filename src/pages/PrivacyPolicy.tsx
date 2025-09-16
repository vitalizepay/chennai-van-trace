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
            "Full name and contact details (email, phone number)",
            "Home address for pickup/drop-off locations",
            "Emergency contact information",
            "Driver license information (for drivers only)",
            "Children's information (for parents only)"
          ]
        },
        {
          subtitle: "Location Data",
          items: [
            "Real-time GPS location of school vans",
            "Route information and stops",
            "Pickup and drop-off locations",
            "Historical location data for safety purposes"
          ]
        },
        {
          subtitle: "Usage Information",
          items: [
            "Login times and app usage patterns",
            "Device information and IP address",
            "Communication logs and notifications",
            "Attendance records and travel history"
          ]
        }
      ]
    },
    {
      title: "How We Use Your Information",
      icon: <Users className="h-5 w-5" />,
      content: [
        {
          subtitle: "Safety and Security",
          items: [
            "Real-time tracking to ensure child safety",
            "Emergency response and SOS functionality",
            "Route optimization and traffic management",
            "Attendance monitoring and reporting"
          ]
        },
        {
          subtitle: "Communication",
          items: [
            "Notifications about van arrivals and delays",
            "Emergency alerts and important announcements",
            "Schedule changes and route updates",
            "Parent-school communication facilitation"
          ]
        },
        {
          subtitle: "Service Improvement",
          items: [
            "Analyzing usage patterns to improve services",
            "Optimizing routes for efficiency",
            "Enhancing safety features and protocols",
            "Technical support and troubleshooting"
          ]
        }
      ]
    },
    {
      title: "Data Protection and Security",
      icon: <Lock className="h-5 w-5" />,
      content: [
        {
          subtitle: "Security Measures",
          items: [
            "End-to-end encryption for all sensitive data",
            "Secure cloud storage with regular backups",
            "Multi-factor authentication for admin accounts",
            "Regular security audits and vulnerability assessments"
          ]
        },
        {
          subtitle: "Access Controls",
          items: [
            "Role-based access (Parents, Drivers, Administrators)",
            "Admin approval required for new user accounts",
            "Regular review and update of user permissions",
            "Automatic session timeouts for security"
          ]
        },
        {
          subtitle: "Data Retention",
          items: [
            "Location data stored for maximum 90 days",
            "User accounts active until graduation or withdrawal",
            "Activity logs maintained for 1 year for security purposes",
            "Immediate deletion upon account termination request"
          ]
        }
      ]
    },
    {
      title: "Your Rights and Choices",
      icon: <Shield className="h-5 w-5" />,
      content: [
        {
          subtitle: "Privacy Rights",
          items: [
            "Right to access your personal data",
            "Right to correct inaccurate information",
            "Right to delete your account and data",
            "Right to download your data (portability)"
          ]
        },
        {
          subtitle: "Control Options",
          items: [
            "Manage notification preferences",
            "Control location sharing settings",
            "Update emergency contact information",
            "Request data deletion or account deactivation"
          ]
        }
      ]
    },
    {
      title: "Third-Party Services",
      icon: <MapPin className="h-5 w-5" />,
      content: [
        {
          subtitle: "Service Providers",
          items: [
            "Google Maps for location and routing services",
            "Supabase for secure data storage and authentication",
            "SMS/Email providers for notifications",
            "Analytics services for app improvement"
          ]
        },
        {
          subtitle: "Data Sharing",
          items: [
            "We do not sell personal data to third parties",
            "Limited sharing with school administration for safety",
            "Emergency services access during SOS situations",
            "Legal compliance when required by law"
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
                  <CardTitle className="text-2xl">Privacy Policy</CardTitle>
                  <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The School Van Tracker system is designed to ensure the safety and security of students 
                during their commute to and from school. This Privacy Policy explains how we collect, 
                use, protect, and share information in connection with our service.
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Important:</strong> By using the School Van Tracker application, you consent 
                  to the collection and use of information as described in this policy. If you do not 
                  agree with this policy, please do not use our services.
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
                    <strong>Email:</strong> privacy@tnschooltracker.gov.in
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong> 1800-XXX-XXXX (Toll-free)
                  </p>
                  <p className="text-sm">
                    <strong>Address:</strong> Department of Education<br />
                    Government Office Complex
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
                  We may update this Privacy Policy from time to time. We will notify you of any 
                  changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
                <p className="text-sm text-muted-foreground">
                  Continued use of the service after changes become effective constitutes acceptance 
                  of the revised policy.
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