import { ArrowLeft, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface PaymentStatusProps {
  onBack: () => void;
}

export function PaymentStatus({ onBack }: PaymentStatusProps) {
  const currentDues = {
    month: "March 2026",
    amount: 8500,
    dueDate: "March 10, 2026",
    status: "pending",
  };

  const paymentHistory = [
    {
      id: "PAY001",
      month: "February 2026",
      amount: 8500,
      paidOn: "February 8, 2026",
      status: "paid",
      method: "UPI",
    },
    {
      id: "PAY002",
      month: "January 2026",
      amount: 8500,
      paidOn: "January 5, 2026",
      status: "paid",
      method: "Net Banking",
    },
    {
      id: "PAY003",
      month: "December 2025",
      amount: 8500,
      paidOn: "December 7, 2025",
      status: "paid",
      method: "UPI",
    },
  ];

  const breakdown = [
    { item: "Room Rent", amount: 6000 },
    { item: "Mess Charges", amount: 2000 },
    { item: "Maintenance", amount: 300 },
    { item: "Electricity", amount: 200 },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl">Payment Status</h1>
        </div>
        <p className="text-sm opacity-90 ml-13">Manage your payments</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Current Dues */}
        <Card className="border-none shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#FB8C00] to-[#F57C00]" />
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1">Current Dues</h3>
                <p className="text-sm text-gray-600">{currentDues.month}</p>
              </div>
              <Badge className="bg-[#FB8C00] text-white">Pending</Badge>
            </div>
            
            <div className="mb-4">
              <p className="text-3xl text-[#1E88E5] mb-2">₹{currentDues.amount.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Due by {currentDues.dueDate}</span>
              </div>
            </div>
            
            <Button className="w-full h-12 bg-gradient-to-r from-[#1E88E5] to-[#26A69A] text-white">
              Pay Now
            </Button>
          </CardContent>
        </Card>

        {/* Payment Breakdown */}
        <Card className="border-none shadow-md">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Payment Breakdown</h3>
            
            <div className="space-y-3">
              {breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.item}</span>
                  <span className="text-sm font-semibold">₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-semibold text-[#1E88E5]">
                    ₹{currentDues.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payment History</h2>
        </div>
        
        <div className="space-y-3">
          {paymentHistory.map((payment) => (
            <Card key={payment.id} className="border-none shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#43A047]/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-[#43A047]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{payment.month}</h3>
                      <p className="text-xs text-gray-600">Transaction ID: {payment.id}</p>
                    </div>
                  </div>
                  <Badge className="bg-[#43A047] text-white text-xs">Paid</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-semibold">₹{payment.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid On</p>
                    <p className="font-semibold">{payment.paidOn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Method</p>
                    <p className="font-semibold">{payment.method}</p>
                  </div>
                </div>
                
                <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-[#1E88E5] border border-[#1E88E5] rounded-lg hover:bg-blue-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
