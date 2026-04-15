<script setup>
    import NavigationBar from './NavigationBar.vue';
    import Searchbar from './Searchbar.vue';
</script>

<template>
    <header>
        <div class="headerContainer">
            <div class="logo-wrapper">
                <img src="../assets/images/logo.png" alt="Vendora">
            </div>

            <NavigationBar/>
            <Searchbar/>
            
        </div>

    </header>
</template>
