
'use client';

import Container from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters.' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(data);
    // Add toast notification for success/failure
    alert('Message sent successfully! (This is a demo)');
  };

  return (
    <Container>
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-3">Contact Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We'd love to hear from you! Whether you have a question about our products, an order, or anything else, our team is ready to answer all your questions.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Form Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a Message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} placeholder="John Doe" className="mt-1" />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...register('email')} placeholder="you@example.com" className="mt-1" />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" {...register('subject')} placeholder="Question about an order" className="mt-1" />
                {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject.message}</p>}
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" {...register('message')} placeholder="Your message here..." rows={5} className="mt-1" />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message.message}</p>}
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8">
          <h2 className="text-2xl font-headline font-semibold text-foreground">Our Contact Information</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-accent/20 text-accent p-3 rounded-full">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Our Address</h3>
                <p className="text-muted-foreground">North East University Bangladesh,Sylhet</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-accent/20 text-accent p-3 rounded-full">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Email Us</h3>
                <p className="text-muted-foreground">support@canfashion.com</p>
                <p className="text-muted-foreground">sales@canfashion.com</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="bg-accent/20 text-accent p-3 rounded-full">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Call Us</h3>
                <p className="text-muted-foreground">+88 0177-5677-900</p>
                <p className="text-muted-foreground">Mon - Fri, 9am - 6pm EST</p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-headline font-semibold text-foreground mb-3">Find us on Map</h3>
             <div className="aspect-video w-full rounded-lg overflow-hidden shadow-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1809.6097979586339!2d91.86200423860689!3d24.89049012754853!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3751aacd70cd7665%3A0xc8ae330ad72490dd!2sNorth%20East%20University%20Bangladesh%2CSylhet!5e0!3m2!1sen!2sbd!4v1746296865948!5m2!1sen!2sbd"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                title="Google Maps Location of CAN Fashion"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

