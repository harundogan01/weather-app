<template>
    <div class="common-container">
        <Header />
        <MainSection />
    </div>
</template>

<script setup>
import Header from './Header.vue'
import MainSection from './MainSection.vue'
</script>

<style lang="css" scoped>
    .common-container {
        height: 100%;
        position: relative;
    }
</style>