import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContentWrapper,
  TabsTriggerText,
  TabsIndicator,
} from '@/components/ui/tabs';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ArrowDown, ArrowUp, Plus, Tag, Wallet, TrendingUp, TrendingDown, ChartLine, Receipt, PiggyBank, CreditCard, Target } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

export default function Finance() {
  return (
    <View className='bg-background flex-1 px-6 gap-4'>
      <View className="flex-row items-center gap-2">
        <Button variant='outline' className="rounded-full bg-card border-border/40 h-10 px-4">
          <ButtonIcon as={Wallet} className="text-primary" />
          <ButtonText className="text-primary font-medium ml-1">Add Wallet</ButtonText>
        </Button>
        <Button variant='outline' className="rounded-full bg-card border-border/40 h-10 px-4">
          <ButtonIcon as={Tag} className="text-primary" />
          <ButtonText className="text-primary font-medium ml-1">Category</ButtonText>
        </Button>
        <Button className="rounded-full h-10 px-4">
          <ButtonIcon as={Plus} className="text-primary-foreground" />
          <ButtonText className="text-primary-foreground font-medium ml-1">Transaction</ButtonText>
        </Button>
      </View>
      <View className="flex-row gap-4">
        <Card className="flex-1 rounded-3xl p-4 bg-card border-border/40" size="sm">
          <View className="flex-row justify-between items-start ">
            <Text className="text-muted-foreground text-sm font-medium">Month Income</Text>
            <View className="h-8 w-8 rounded-full bg-emerald-100 items-center justify-center">
              <TrendingUp size={16} color="#10b981" />
            </View>
          </View>
          <VStack className="gap-1 mt-2">
            <Text className="text-xl font-bold text-foreground">Rp 0</Text>
            <View className="flex-row items-center gap-1">
              <ArrowUp size={12} color="#10b981" />
              <Text className="text-emerald-500 text-xs font-medium">This month</Text>
            </View>
          </VStack>
        </Card>

        <Card className="flex-1 rounded-3xl p-4 bg-card border-border/40" size="sm">
          <View className="flex-row justify-between items-start ">
            <Text className="text-muted-foreground text-sm font-medium">Month Expense</Text>
            <View className="h-8 w-8 rounded-full bg-rose-100 items-center justify-center">
              <TrendingDown size={16} color="#f43f5e" />
            </View>
          </View>
          <VStack className="gap-1 mt-2">
            <Text className="text-xl font-bold text-foreground">Rp 2.586.000</Text>
            <View className="flex-row items-center gap-1">
              <ArrowDown size={12} color="#f43f5e" />
              <Text className="text-rose-500 text-xs font-medium">This month</Text>
            </View>
          </VStack>
        </Card>
      </View>

      <Tabs defaultValue="Overview" variant="underlined">
        <TabsList>
          <TabsTrigger value="Overview">
            <ChartLine size={16} />
            <TabsTriggerText>Overview</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Transactions">
            <Receipt size={16} />
            <TabsTriggerText>Transaction</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Budgets">
            <Target size={16} />
            <TabsTriggerText>Budgets</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Goals">
            <PiggyBank size={16} />
            <TabsTriggerText>Goals</TabsTriggerText>
          </TabsTrigger>
          <TabsTrigger value="Debts">
            <CreditCard size={16} />
            <TabsTriggerText>Debts</TabsTriggerText>
          </TabsTrigger>
          <TabsIndicator />
        </TabsList>

        <TabsContentWrapper>
          <TabsContent value="Transactions">
            <Box>
              <Text className="text-foreground">Welcome to the Home tab!</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Budgets">
            <Box>
              <Text className="text-foreground">Your profile information</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Goals">
            <Box>
              <Text className="text-foreground">Welcome to the Home tab!</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Savings">
            <Box>
              <Text className="text-foreground">Settings and preferences</Text>
            </Box>
          </TabsContent>
          <TabsContent value="Debts">
            <Box>
              <Text className="text-foreground">Welcome to the Home tab!</Text>
            </Box>
          </TabsContent>
        </TabsContentWrapper>
      </Tabs>
    </View>
  );
}
