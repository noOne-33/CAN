
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, Smartphone } from 'lucide-react';

export const metadata = {
  title: 'Payment Methods - CAN',
  description: 'View your payment options for CAN.',
};

export default function PaymentMethodsPage() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <CreditCard size={24} className="mr-2 text-primary" />
          Payment Methods
        </CardTitle>
        <CardDescription>Information about how you can pay for your orders on CAN.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <DollarSign size={20} className="mr-2 text-green-600" />
            Currently Supported
          </h3>
          <p className="text-muted-foreground">
            We currently support <span className="font-medium text-foreground">Cash on Delivery (COD)</span> for all orders.
            You can pay in cash when your order is delivered to your doorstep.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <CreditCard size={20} className="mr-2 text-blue-600" />
            Future Payment Options
          </h3>
          <p className="text-muted-foreground">
            We are working hard to bring you more convenient payment methods soon, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2 pl-4">
            <li>Credit/Debit Card payments</li>
            <li>Mobile Banking (e.g., bKash, Nagad)</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            Stay tuned for updates!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
