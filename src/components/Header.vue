<script setup>
    import NavigationBar from './NavigationBar.vue';
    import SearchBar from './SearchBar.vue';
</script>

<template>
    <header>
        <div class="headerContainer">
            <div class="logo-wrapper">
                <img src="../assets/images/logo.png" alt="Vendora">
            </div>

            <NavigationBar/>
            <SearchBar/>
            
        </div>

    </header>
</template>
