package dev.thatpotato;

import com.carrotsearch.hppc.ObjectHashSet;
import dev.thatpotato.util.TimedTask;
import io.javalin.Javalin;
import io.javalin.http.BadRequestResponse;
import io.javalin.json.JavalinGson;
import io.javalin.plugin.bundled.CorsPluginConfig;
import kotlin.Pair;

import java.io.File;

public class Main {
    AstroCatalog catalog = new AstroCatalog();
    void main(String[] args) {
				String fileName = args.length >= 1 && args[0] != null ? args[0] : "catalog.jsonl.gz";
				long readTime = TimedTask.timed(() -> CatalogReader.read(new File(fileName), catalog));
        IO.println("took %ss to read %s objects".formatted(((float)readTime)/1000, catalog.currIndex));
				catalog.freezeAndPackCatalog();
				catalog.compileIndex();
//        dbgSearch("IC 434");
				var runtime = Runtime.getRuntime();
				long usedMem = (runtime.totalMemory()-runtime.freeMemory()) / (1024 * 1024);
				IO.println("RAM Usage: "+usedMem+"MB");
				initServer();
		}

    private void initServer() {
				Javalin.create(config -> {
						config.routes.get("/search", ctx -> {
								String query = ctx.queryParam("q");
								if (query == null || query.isBlank() || !catalog.ready) {
										ctx.result("[]");
										return;
								}
								var types = ObjectHashSet.from(ctx.queryParams("type").toArray(String[]::new));
								String limitS = ctx.queryParam("limit");
								int limit = limitS != null ? Integer.parseInt(limitS) : 10;
								var res = TimedTask.timed(() -> catalog.search(query, types.isEmpty() ? null : types, limit));
								IO.println("'%s' took %sms".formatted(query, res.getFirst()));
								ctx.json(res.getSecond());
						});
						config.routes.get("/name", ctx -> {
								String q = ctx.queryParam("name");
								ctx.json(catalog.toJson(catalog.find(q)));
						});
						config.bundledPlugins.enableCors(cors ->
								cors.addRule(CorsPluginConfig.CorsRule::anyHost)
						);
						config.routes.exception(Exception.class, (e, ctx) -> {
								if (e instanceof BadRequestResponse) {
										ctx.status(400).result("{error:\"Bad request: "+e.getMessage()+"\"}");
								} else {
										ctx.status(500).result("{error:\"Internal server error\"}");
								}
						});
						config.jsonMapper(new JavalinGson());
				}).start(2443);
    }

    private void dbgSearch(String q) {
				Pair<Long, Integer> pair = TimedTask.timed(() -> catalog.find(q));
        int o = pair.getSecond();
        IO.println("time to find '%s': %sms".formatted(q, pair.getFirst()));
        IO.println(AstroCatalog.gson.toJson(catalog.toJson(o)));
    }

}
