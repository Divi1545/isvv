import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2, Key, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ApiKey {
  id: number;
  label: string;
  key: string;
  active: boolean;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<ApiKey | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys/list"],
  });

  // Generate new API key
  const generateKeyMutation = useMutation({
    mutationFn: async (label: string) => {
      const response = await apiRequest('POST', '/api/keys/generate', { label });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedKey(data.apiKey);
      setNewKeyLabel("");
      setShowGenerateDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/keys/list"] });
      toast({
        title: "API Key Generated",
        description: "Your new API key has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    },
  });

  // Revoke API key
  const revokeKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', '/api/keys/revoke', { id });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys/list"] });
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleGenerateKey = () => {
    if (newKeyLabel.trim().length < 3) {
      toast({
        title: "Invalid Label",
        description: "Label must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }
    generateKeyMutation.mutate(newKeyLabel.trim());
  };

  const handleRevokeKey = (id: number, label: string) => {
    if (confirm(`Are you sure you want to revoke the API key "${label}"? This action cannot be undone.`)) {
      revokeKeyMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '••••••••••••••••••••••••••••';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Key Management</h1>
          <p className="text-neutral-600 mt-2">
            Generate and manage API keys for external integrations and third-party access.
          </p>
        </div>
        
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for external access to your IslandLoaf platform.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyLabel">Label</Label>
                <Input
                  id="keyLabel"
                  placeholder="e.g., Mobile App, Partner Integration"
                  value={newKeyLabel}
                  onChange={(e) => setNewKeyLabel(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateKey}
                disabled={generateKeyMutation.isPending || newKeyLabel.trim().length < 3}
              >
                {generateKeyMutation.isPending ? "Generating..." : "Generate Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Generated Key Display */}
      {generatedKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              New API Key Generated
            </CardTitle>
            <CardDescription className="text-green-700">
              Please copy this API key now. You won't be able to see it again for security reasons.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-green-800">Label</Label>
                <p className="text-green-900">{generatedKey.label}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-green-800">API Key</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                    {generatedKey.key}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important Security Notice</p>
                    <p>Store this API key securely. Anyone with this key can access your platform's data.</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setGeneratedKey(null)}
                className="w-full"
              >
                I've Copied the Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            Manage your API keys and monitor their usage. Revoked keys cannot be reactivated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-neutral-600 mt-2">Loading API keys...</p>
              </div>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No API Keys</h3>
              <p className="text-neutral-600 mb-4">You haven't generated any API keys yet.</p>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Your First Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.label}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono bg-neutral-100 px-2 py-1 rounded">
                          {maskApiKey(key.key)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(key.key)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.active ? "default" : "secondary"}>
                        {key.active ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {formatDate(key.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      {key.active && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeKey(key.id, key.label)}
                          disabled={revokeKeyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage</CardTitle>
          <CardDescription>
            How to use your API keys to access IslandLoaf data programmatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <p className="text-sm text-neutral-600 mb-2">
                Include your API key in the request headers:
              </p>
              <code className="block p-3 bg-neutral-100 rounded text-xs">
                curl -H "x-api-key: your_api_key_here" https://your-domain.com/api/external/bookings
              </code>
            </div>
            <div>
              <h4 className="font-medium mb-2">Available Endpoints</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• <code>/api/external/bookings</code> - Get all bookings data</li>
                <li>• More endpoints can be added as needed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security Notes</h4>
              <ul className="text-sm text-neutral-600 space-y-1">
                <li>• API keys provide full access to your data</li>
                <li>• Keep your keys secure and never share them publicly</li>
                <li>• Revoke keys immediately if they are compromised</li>
                <li>• Use different keys for different applications or partners</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}