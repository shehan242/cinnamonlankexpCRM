
'use client';

import { useState, useRef } from 'react';
import { useAppStore, Customer, CustomerRanking } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Globe, 
  Sparkles,
  UserPlus,
  Trash2,
  Edit,
  History,
  Camera,
  Upload
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiCustomerInsights, AICustomerInsightsOutput } from '@/ai/flows/ai-customer-insights';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CustomersPage() {
  const { customers, deleteCustomer, addCustomer } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AICustomerInsightsOutput | null>(null);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Customer Form State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newRanking, setNewRanking] = useState<CustomerRanking>('Normal');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit for local storage
        toast({ 
          title: "File too large", 
          description: "Please select an image under 2MB.", 
          variant: "destructive" 
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
        toast({ title: "Image Uploaded", description: "Profile picture set from local file." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustomer = () => {
    if (!newName || !newEmail || !newCountry || !newPhone) {
      toast({ 
        title: "Missing Fields", 
        description: "Please fill in all the required contact details.", 
        variant: "destructive" 
      });
      return;
    }

    addCustomer({
      name: newName,
      email: newEmail,
      country: newCountry,
      phone: newPhone,
      notes: newNotes,
      ranking: newRanking,
      avatar: newAvatar || `https://picsum.photos/seed/${newName}/200/200`
    });

    toast({ title: "Customer Added", description: `${newName} has been added to your contacts.` });
    
    // Reset form
    setIsAddOpen(false);
    setNewName('');
    setNewEmail('');
    setNewCountry('');
    setNewPhone('');
    setNewNotes('');
    setNewAvatar('');
    setNewRanking('Normal');
  };

  const handleRunAI = async (customer: Customer) => {
    setAnalyzingId(customer.id);
    setAiResult(null);
    try {
      const result = await aiCustomerInsights({
        customerNotes: customer.notes,
        purchaseHistory: customer.purchaseHistory.map(p => ({
          productName: p.items.join(', '),
          price: p.amount,
          quantity: 1, 
          date: p.date
        }))
      });
      setAiResult(result);
    } catch (err) {
      toast({ title: "AI Analysis Failed", description: "Could not reach the AI service.", variant: "destructive" });
    } finally {
      setAnalyzingId(null);
    }
  };

  const getRankBadge = (rank: CustomerRanking) => {
    switch(rank) {
      case 'VVIP': return <Badge className="bg-purple-600 hover:bg-purple-700">{rank}</Badge>;
      case 'VIP': return <Badge className="bg-amber-500 hover:bg-amber-600">{rank}</Badge>;
      case 'Regular': return <Badge variant="secondary">{rank}</Badge>;
      default: return <Badge variant="outline">{rank}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">CRM & Leads</h1>
          <p className="text-muted-foreground">Manage your relationships and view AI-driven insights.</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <UserPlus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Register New Customer</DialogTitle>
              <DialogDescription>
                Enter the details of the new business partner or lead.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col items-center justify-center mb-4 space-y-3">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-lg group-hover:border-primary/50 transition-all">
                    <AvatarImage src={newAvatar || `https://picsum.photos/seed/placeholder/200/200`} className="object-cover" />
                    <AvatarFallback><Camera className="w-10 h-10 opacity-50" /></AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-5 h-5 text-white mb-1" />
                    <span className="text-white text-[10px] font-bold">UPLOAD FILE</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <p className="text-[10px] text-muted-foreground">Click the photo to upload from your local device.</p>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} className="col-span-3" placeholder="Company or Individual" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="col-span-3" placeholder="partner@example.com" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">Country</Label>
                <Input id="country" value={newCountry} onChange={(e) => setNewCountry(e.target.value)} className="col-span-3" placeholder="e.g. Germany" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Contact</Label>
                <Input id="phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="col-span-3" placeholder="+1..." />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ranking" className="text-right">Level</Label>
                <Select value={newRanking} onValueChange={(v: CustomerRanking) => setNewRanking(v)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="VVIP">VVIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <Textarea id="notes" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} className="col-span-3 min-h-[100px]" placeholder="Specific requirements, shipping preferences..." />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCustomer} className="w-full">Create Customer Record</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">{customers.filter(c => c.ranking === 'VIP' || c.ranking === 'VVIP').length}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase">Premium Partners</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">{customers.length}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase">Active Contacts</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-bold">{new Set(customers.map(c => c.country)).size}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase">Countries Served</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Customer Directory</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Filter customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9" 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Customer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="group hover:bg-muted/10">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={customer.avatar} className="object-cover" />
                        <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{customer.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{customer.notes}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                      {customer.country}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRankBadge(customer.ranking)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleRunAI(customer)}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-primary" />
                              AI Insights: {customer.name}
                            </DialogTitle>
                            <DialogDescription>
                              Personalized analysis based on interaction notes and history.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {analyzingId === customer.id ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm animate-pulse">Consulting the business strategist...</p>
                            </div>
                          ) : aiResult ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                  <Label className="text-[10px] uppercase text-muted-foreground">Recommended Classification</Label>
                                  <p className="text-xl font-bold text-primary mt-1">{aiResult.classification}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                  <Label className="text-[10px] uppercase text-muted-foreground">Engagement Strategy</Label>
                                  <p className="text-sm font-medium mt-1">Found {aiResult.engagementStrategies.length} actions</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Reasoning</h4>
                                <p className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg italic">
                                  "{aiResult.reasoning}"
                                </p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Suggested Strategies</h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {aiResult.engagementStrategies.map((strat, i) => (
                                    <li key={i} className="text-xs p-3 bg-secondary/30 rounded-md flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 shrink-0" />
                                      {strat}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 text-center text-muted-foreground">
                              Failed to load insights.
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2">
                            <Edit className="w-4 h-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <History className="w-4 h-4" /> View Sales
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="gap-2 text-destructive"
                            onClick={() => deleteCustomer(customer.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    No customers found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
