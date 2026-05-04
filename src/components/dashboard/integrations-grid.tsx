import { IntegrationStatus } from '@/hooks/use-integrations';
import React from 'react'
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface Integration {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    category: string;
}

function IntegrationsGrid({
    loading,
    filteredIntegrations,
    connectedIntegrations,
    connecting,
    handleConnect,
    handleDisconnect,
}: {
    loading: boolean;
    filteredIntegrations: Integration[];
    connectedIntegrations: IntegrationStatus;
    connecting: string | null;
    handleConnect: (id: string) => Promise<void>;
    handleDisconnect: (id: string) => Promise<void>;
}) {

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
                <div
                    key={i}
                    className="bg-card border border-border/60 p-10 rounded-[32px] flex flex-col"
                >
                    <div className="space-y-4 flex-1">
                        <div className="flex justify-between items-start">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>

                        <div className="space-y-2">
                            <Skeleton className="h-7 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>

                    <Skeleton className="h-10 w-full mt-6 rounded-md" />
                </div>
            ))}
        </div>
    )
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map((item) => {
                const isConnected = connectedIntegrations[item.id];
                const isConnecting = connecting === item.id;
                const Icon = item.icon;

                return (
                    <div
                        key={item.id}
                        className="bg-card border border-border/60 p-10 rounded-[32px] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300"
                    >
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center p-2"
                                    style={{ backgroundColor: `${item.iconColor}10` }}
                                >
                                    <Icon
                                        className="size-full"
                                        style={{ color: item.iconColor }}
                                    />
                                </div>
                                {isConnected ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                                    >
                                        Connected
                                    </Badge>
                                ) : (
                                    <Badge
                                        variant="outline"
                                        className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                                    >
                                        Inactive
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-foreground mb-1">
                                    {item.name}
                                </h3>
                                <p className="text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </div>

                        <Button
                            variant={isConnected ? "secondary" : "default"}
                            className={cn(
                                "mt-6 w-full h-10 rounded-md font-semibold text-sm transition-all",
                                !isConnected && "shadow-sm"
                            )}
                            onClick={() => {
                                if (isConnected) {
                                    handleDisconnect(item.id);
                                } else {
                                    handleConnect(item.id);
                                }
                            }}
                            disabled={isConnecting}
                        >
                            {isConnecting
                                ? "Connecting..."
                                : isConnected
                                    ? "Manage"
                                    : "Connect"}
                        </Button>
                    </div>
                );
            })}
        </div>
    )
}

export default IntegrationsGrid