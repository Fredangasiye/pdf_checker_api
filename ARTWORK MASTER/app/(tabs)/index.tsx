import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CompanyCard } from '@/components/CompanyCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useCompanies, useAuth } from '@/hooks/useAuth';
import { Company } from '@/types';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/Colors';

export default function HomeScreen() {
  const { companies, isLoading, getCompanies } = useCompanies();
  const { authState } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fuzzy matching function
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Direct substring match
    if (textLower.includes(queryLower)) return true;
    
    // Fuzzy character matching
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  // Filter companies based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(companies.slice(0, 6));
      return;
    }

    const filtered = companies.filter(company => {
      return (
        fuzzyMatch(company.businessName, searchQuery) ||
        fuzzyMatch(company.category, searchQuery) ||
        fuzzyMatch(company.description, searchQuery) ||
        fuzzyMatch(company.location, searchQuery) ||
        fuzzyMatch(company.ownerName, searchQuery)
      );
    });
    setFilteredCompanies(filtered);
  }, [searchQuery, companies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getCompanies();
    setRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {authState.user?.firstName || 'Welcome'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Ionicons name="person-circle" size={40} color={Colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.gray500} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Christian businesses..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.gray500} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="search" size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionText}>Browse All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/company')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="business" size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionText}>My Business</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(auth)/setup-company')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="add-circle" size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionText}>Add Business</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Companies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'Featured Businesses'}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {searchQuery 
                ? `${filteredCompanies.length} results found`
                : 'Discover Christian-owned businesses'
              }
            </Text>
          </View>

          {filteredCompanies.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={Colors.gray400} />
              <Text style={styles.emptyTitle}>No businesses found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Check back later for new businesses'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.companiesList}>
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onPress={() => router.push(`/(tabs)/company-profile?id=${company.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: Typography.sm,
    color: Colors.gray200,
    marginBottom: Spacing.xs,
  },
  userName: {
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.gray900,
    paddingVertical: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.gray700,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.gray600,
  },
  companiesList: {
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '600',
    color: Colors.gray700,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.gray500,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: Spacing.xxl,
  },
}); 